import { useEffect, useState } from 'react'

const CATEGORIES = [
  'Drinks',
  'Cakes',
  'Buns & Pastries',
  'Sandwiches',
  'Small Bites',
]

function emptyForm() {
  return {
    name: '',
    description: '',
    category: 'Drinks',
    price: '',
    image: '',
    available: true,
  }
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    cache: 'no-store',
    ...options,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? 'Your staff session has expired. Refresh and sign in again.'
        : data?.error || 'Could not complete the request.',
    )
  }

  if (data === null) {
    throw new Error('The server returned an empty response.')
  }

  return data
}

// Uploaded images are served by your local backend.
// Existing /menu images are served by the frontend.
function imageSource(image) {
  return image.startsWith('/uploads/menu/')
    ? `http://127.0.0.1:5000${image}`
    : image
}

export default function MenuManagement() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [showArchived, setShowArchived] = useState(false)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const data = await api('/api/staff/menu', {
          signal: controller.signal,
        })

        if (!Array.isArray(data)) {
          throw new Error('The server returned an invalid menu.')
        }

        if (!controller.signal.aborted) {
          setItems(data)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => controller.abort()
  }, [])

  async function refreshMenu() {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const data = await api('/api/staff/menu')

      if (!Array.isArray(data)) {
        throw new Error('The server returned an invalid menu.')
      }

      setItems(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm())
    setEditorOpen(true)
    setError('')
    setMessage('')
  }

  function openEdit(item) {
    setEditingId(item.id)
    setForm({
      name: item.name,
      description: item.description || '',
      category: item.category,
      price: String(item.price),
      image: item.image,
      available: item.available,
    })
    setEditorOpen(true)
    setError('')
    setMessage('')
  }

  function updateField(event) {
    const { name, value } = event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function replaceItem(updated) {
    setItems((current) =>
      current.some((item) => item.id === updated.id)
        ? current.map((item) =>
            item.id === updated.id ? updated : item,
          )
        : [...current, updated],
    )
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    setError('')
    setMessage('')

    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
    ) {
      setError('Choose a PNG, JPG, or WebP image.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Choose an image smaller than 5 MB.')
      return
    }

    setBusy(true)

    try {
      const data = await api('/api/staff/menu-image', {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      })

      setForm((current) => ({
        ...current,
        image: data.image,
      }))

      setMessage('Image uploaded. Save the item to apply it.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function saveItem(event) {
    event.preventDefault()
    if (busy) return

    const price = Number(form.price)

    if (
      !Number.isSafeInteger(price) ||
      price < 1 ||
      price > 1000000
    ) {
      setError('Enter a whole-rupee price between 1 and 1,000,000.')
      return
    }

    if (!form.image.trim()) {
      setError('Upload an image or enter an existing image path.')
      return
    }

    setBusy(true)
    setError('')
    setMessage('')

    try {
      const updated = await api(
        editingId
          ? `/api/staff/menu/${encodeURIComponent(editingId)}`
          : '/api/staff/menu',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim(),
            category: form.category,
            price,
            image: form.image.trim(),
            available: form.available,
          }),
        },
      )

      replaceItem(updated)
      setEditorOpen(false)
      setMessage(editingId ? 'Menu item updated.' : 'Menu item added.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function changeItem(item, action, value) {
    if (busy) return

    setBusy(true)
    setError('')
    setMessage('')

    try {
      const updated = await api(
        `/api/staff/menu/${encodeURIComponent(item.id)}/${action}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            action === 'availability'
              ? { available: value }
              : { archived: value },
          ),
        },
      )

      replaceItem(updated)
      setMessage('Menu item updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(search.trim().toLowerCase())

    const matchesCategory =
      category === 'All' || item.category === category

    return (
      matchesSearch &&
      matchesCategory &&
      (showArchived || !item.archived)
    )
  })

  const previewAllowed =
    /^\/(?:menu|uploads\/menu)\/[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp)$/i.test(
      form.image,
    )

  return (
    <section className="menu-admin">
      <header className="menu-admin-header">
        <div>
          <h1>Menu Management</h1>
          <p>Manage your café items, prices, and availability.</p>
        </div>

        <button
          className="menu-admin-primary"
          type="button"
          onClick={openAdd}
          disabled={busy || loading || editorOpen}
        >
          + Add item
        </button>
      </header>

      {error && (
        <p className="menu-admin-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="menu-admin-message" role="status">
          {message}
        </p>
      )}

      {editorOpen && (
        <form className="menu-admin-editor" onSubmit={saveItem}>
          <h2>{editingId ? 'Edit item' : 'Add menu item'}</h2>

          <fieldset disabled={busy}>
            <div className="menu-admin-form-grid">
              <label>
                Item name
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  maxLength={100}
                  required
                />
              </label>

              <label>
                Category
                <select
                  name="category"
                  value={form.category}
                  onChange={updateField}
                >
                  {CATEGORIES.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>

              <label>
                Price (Rs.)
                <input
                  name="price"
                  type="number"
                  min="1"
                  max="1000000"
                  step="1"
                  value={form.price}
                  onChange={updateField}
                  required
                />
              </label>

              <label>
                Availability
                <select
                  value={String(form.available)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      available: event.target.value === 'true',
                    }))
                  }
                >
                  <option value="true">Available</option>
                  <option value="false">Sold out</option>
                </select>
              </label>

              <label className="menu-admin-full">
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={updateField}
                  maxLength={500}
                  rows={3}
                />
              </label>

              <label>
                Upload product image
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={uploadImage}
                />
                <small>PNG, JPG, or WebP. Maximum 5 MB.</small>
              </label>

              <label>
                Image path
                <input
                  name="image"
                  value={form.image}
                  onChange={updateField}
                  placeholder="/menu/americano.png"
                  required
                />
                <small>
                  Use an existing image path or upload a new photo.
                </small>
              </label>
            </div>

            {previewAllowed && (
              <img
                className="menu-admin-preview"
                src={imageSource(form.image)}
                alt="Product preview"
              />
            )}

            <div className="menu-admin-actions">
              <button
                className="menu-admin-primary"
                type="submit"
              >
                Save item
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditorOpen(false)
                  setError('')
                  setMessage('')
                }}
              >
                Cancel
              </button>
            </div>
          </fieldset>

          {busy && <p role="status">Saving or uploading…</p>}
        </form>
      )}

      <div className="menu-admin-filters">
        <label>
          Search items
          <input
            type="search"
            placeholder="Search by name"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <label>
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>

        <label className="menu-admin-checkbox">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(event) =>
              setShowArchived(event.target.checked)
            }
          />
          Include archived
        </label>

        <button
          type="button"
          onClick={refreshMenu}
          disabled={busy || loading}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p role="status">Loading menu…</p>
      ) : filteredItems.length === 0 ? (
        <p>No menu items to display.</p>
      ) : (
        <div className="menu-admin-table-wrap">
          <table className="menu-admin-table">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Category</th>
                <th scope="col">Price</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="menu-admin-product">
                      <img
                        src={imageSource(item.image)}
                        alt=""
                        loading="lazy"
                      />
                      <strong>{item.name}</strong>
                    </div>
                  </td>

                  <td>{item.category}</td>

                  <td>
                    Rs. {item.price.toLocaleString('en-LK')}
                  </td>

                  <td>
                    <span
                      className={`menu-admin-badge ${
                        item.archived
                          ? 'is-archived'
                          : item.available
                            ? 'is-available'
                            : 'is-sold-out'
                      }`}
                    >
                      {item.archived
                        ? 'Archived'
                        : item.available
                          ? 'Available'
                          : 'Sold out'}
                    </span>
                  </td>

                  <td>
                    <div className="menu-admin-row-actions">
                      <button
                        type="button"
                        disabled={busy || editorOpen}
                        onClick={() => openEdit(item)}
                      >
                        Edit
                      </button>

                      {!item.archived && (
                        <button
                          type="button"
                          disabled={busy || editorOpen}
                          onClick={() =>
                            changeItem(
                              item,
                              'availability',
                              !item.available,
                            )
                          }
                        >
                          {item.available
                            ? 'Mark sold out'
                            : 'Make available'}
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={busy || editorOpen}
                        onClick={() =>
                          changeItem(
                            item,
                            'archive',
                            !item.archived,
                          )
                        }
                      >
                        {item.archived ? 'Restore' : 'Archive'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}