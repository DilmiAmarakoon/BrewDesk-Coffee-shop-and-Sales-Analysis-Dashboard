import { useEffect, useState } from 'react'
import './App.css'

const CATEGORIES = [
  'Drinks',
  'Cakes',
  'Buns & Pastries',
  'Sandwiches',
  'Small Bites',
]

const PICKUP_TIMES = ['16:30', '16:45', '17:00']

function money(value) {
  return `Rs. ${Number(value).toLocaleString('en-LK')}`
}

function imageSource(image = '') {
  return image.startsWith('/uploads/menu/')
    ? `http://127.0.0.1:5000${image}`
    : image
}

async function readResponse(response) {
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      data?.error || data?.message || 'Could not complete the request.',
    )
  }

  if (data === null) {
    throw new Error('The server returned an empty response.')
  }

  return data
}

function Icon({ name }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === 'bag' ? (
        <>
          <path d="M5 7h14l1 14H4L5 7Z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </>
      ) : (
        <>
          <path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" />
          <path d="M9 8h6M9 12h6" />
        </>
      )}
    </svg>
  )
}

function statusLabel(status, fulfilment) {
  const labels = {
    received: 'Received',
    preparing: 'Preparing',
    ready: fulfilment === 'delivery' ? 'Ready for dispatch' : 'Ready',
    out_for_delivery: 'Out for delivery',
    delivered: 'Delivered',
    collected: 'Collected',
  }

  return labels[status] || status || 'Received'
}

export default function App() {
  const [menuItems, setMenuItems] = useState([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [menuError, setMenuError] = useState('')
  const [menuVersion, setMenuVersion] = useState(0)
  const [activeCategory, setActiveCategory] = useState('Drinks')

  const [bag, setBag] = useState(() => {
  try {
    const saved = JSON.parse(
      localStorage.getItem('brewdesk-bag') || '{}',
    )

    if (
      !saved ||
      typeof saved !== 'object' ||
      Array.isArray(saved)
    ) {
      return {}
    }

    const validItems = Object.entries(saved).filter(
      ([id, item]) =>
        /^[a-f0-9]{24}$/i.test(id) &&
        item &&
        item.id === id &&
        typeof item.name === 'string' &&
        typeof item.price === 'number' &&
        Number.isFinite(item.price) &&
        item.price > 0 &&
        Number.isInteger(item.quantity) &&
        item.quantity >= 1 &&
        item.quantity <= 99,
    )

    return Object.fromEntries(validItems)
  } catch {
    return {}
  }
}) 
  const [fulfilment, setFulfilment] = useState('pickup')
  const [pickupTime, setPickupTime] = useState(PICKUP_TIMES[0])

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    note: '',
  })

  const [order, setOrder] = useState(() => {
  try {
    const saved = JSON.parse(
      sessionStorage.getItem('brewdesk-latest-order') || 'null',
    )

    if (
      !saved ||
      !Number.isSafeInteger(saved.number) ||
      saved.number < 1 ||
      typeof saved.total !== 'number' ||
      !Number.isFinite(saved.total) ||
      !['pickup', 'delivery'].includes(saved.fulfilment) ||
      typeof saved.status !== 'string' ||
      !Array.isArray(saved.items)
    ) {
      return null
    }

    return saved
  } catch {
    return null
  }
}) 
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const [trackingError, setTrackingError] = useState('')
// Keep the latest order when navigating or refreshing this tab.
useEffect(() => {
  try {
    if (order) {
      sessionStorage.setItem(
        'brewdesk-latest-order',
        JSON.stringify(order),
      )
    } else {
      sessionStorage.removeItem('brewdesk-latest-order')
    }
  } catch {
    // Ordering still works if browser storage is unavailable.
  }
}, [order])  
  // Keep the shopping bag when navigating or refreshing.
useEffect(() => {
  try {
    if (Object.keys(bag).length === 0) {
      localStorage.removeItem('brewdesk-bag')
    } else {
      localStorage.setItem(
        'brewdesk-bag',
        JSON.stringify(bag),
      )
    }
  } catch {
    // Shopping still works if browser storage is unavailable.
  }
}, [bag]) 
  // Load the current menu from MongoDB through the backend.
  useEffect(() => {
    const controller = new AbortController()

    async function loadMenu() {
      setMenuLoading(true)
      setMenuError('')

      try {
        const response = await fetch('/api/menu', {
          cache: 'no-store',
          signal: controller.signal,
        })

        const data = await readResponse(response)

        if (!Array.isArray(data)) {
          throw new Error('The server returned an invalid menu.')
        }

        if (!controller.signal.aborted) {
          setMenuItems(data)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setMenuError(
            err.message || 'Could not load the menu. Please try again.',
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setMenuLoading(false)
        }
      }
    }

    loadMenu()

    return () => controller.abort()
  }, [menuVersion])

  // Refresh when the customer returns from another browser tab.
  useEffect(() => {
    function refreshOnFocus() {
      setMenuVersion((current) => current + 1)
    }

    window.addEventListener('focus', refreshOnFocus)

    return () => {
      window.removeEventListener('focus', refreshOnFocus)
    }
  }, [])

  const visibleItems = menuItems.filter(
    (item) => item.category === activeCategory,
  )

  const bagItems = Object.values(bag)

  const itemCount = bagItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  )

  const total = bagItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )

  // If a product changes, ask the customer to review it before ordering.
  const bagNeedsReview = bagItems.some((item) => {
    const current = menuItems.find((product) => product.id === item.id)

    return (
      !current ||
      !current.available ||
      current.archived ||
      current.price !== item.price ||
      current.name !== item.name
    )
  })

  function addItem(item) {
    if (
      placing ||
      menuLoading ||
      menuError ||
      !item.available ||
      item.archived
    ) {
      return
    }

    setBag((current) => ({
      ...current,
      [item.id]: {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: Math.min(
          (current[item.id]?.quantity || 0) + 1,
          99,
        ),
      },
    }))

    setError('')
  }

  function removeItem(id) {
    if (placing) return

    setBag((current) => {
      const next = { ...current }
      const item = next[id]

      if (!item) return current

      if (item.quantity <= 1) {
        delete next[id]
      } else {
        next[id] = {
          ...item,
          quantity: item.quantity - 1,
        }
      }

      return next
    })

    setError('')
  }

  function removeAllOfItem(id) {
    if (placing) return

    setBag((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })

    setError('')
  }

  function updateCustomer(event) {
    const { name, value } = event.target

    setCustomer((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function placeOrder(event) {
    event.preventDefault()

    if (placing) return

    setError('')

    if (!bagItems.length) {
      setError('Please add an item to your bag.')
      return
    }

    if (menuLoading || menuError) {
      setError('Please refresh the menu before placing your order.')
      return
    }

    if (bagNeedsReview) {
      setError(
        'Some items have changed. Remove the marked items and add them again from the menu.',
      )
      return
    }

    if (
      fulfilment === 'pickup' &&
      !PICKUP_TIMES.includes(pickupTime)
    ) {
      setError('Choose a valid pickup time.')
      return
    }

    const delivery =
      fulfilment === 'delivery'
        ? {
            name: customer.name.trim(),
            phone: customer.phone.trim(),
            address: customer.address.trim(),
            city: customer.city.trim(),
            note: customer.note.trim(),
          }
        : null

    if (
      delivery &&
      (!delivery.name ||
        !delivery.phone ||
        !delivery.address ||
        !delivery.city)
    ) {
      setError('Please complete your delivery details.')
      return
    }

    setPlacing(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fulfilment,
          pickupTime: fulfilment === 'pickup' ? pickupTime : '',
          delivery,
          items: bagItems.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      })

      const data = await readResponse(response)
      const created = data.order || data

      if (
        !Number.isInteger(created.number) ||
        typeof created.total !== 'number' ||
        !Number.isFinite(created.total) ||
        created.fulfilment !== fulfilment
      ) {
        throw new Error(
          'The server returned incomplete order details. Check with the café before submitting again.',
        )
      }

      setOrder({
        ...created,
        status: created.status || 'received',
        items: created.items || bagItems,
        delivery: created.delivery || delivery,
      })

      setTrackingError('')
      setBag({})

      window.requestAnimationFrame(() => {
        document.getElementById('my-order')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
    } catch (err) {
      setError(err.message || 'Could not place your order.')
      setMenuVersion((current) => current + 1)
    } finally {
      setPlacing(false)
    }
  }

  const orderNumber = order?.number
  const orderFinished =
    order?.status === 'collected' || order?.status === 'delivered'

  useEffect(() => {
    if (!orderNumber || orderFinished) return

    const controller = new AbortController()
    let timeout
    let stopped = false

    async function refreshStatus() {
      try {
        const response = await fetch(
          `/api/orders/${orderNumber}/status`,
          {
            cache: 'no-store',
            signal: controller.signal,
          },
        )

        const data = await readResponse(response)
        const update = data.order || data

        if (typeof update.status !== 'string') {
          throw new Error('Invalid order status.')
        }

        if (stopped) return

        setOrder((current) => {
          if (!current || current.number !== orderNumber) {
            return current
          }

          return {
            ...current,
            status: update.status,
            paidAt: update.paidAt ?? current.paidAt,
          }
        })

        setTrackingError('')

        if (
          update.status === 'collected' ||
          update.status === 'delivered'
        ) {
          return
        }
      } catch (err) {
        if (stopped || err.name === 'AbortError') return

        setTrackingError(
          'Could not refresh your order. Showing the last available update.',
        )
      }

      if (!stopped) {
        timeout = window.setTimeout(refreshStatus, 3000)
      }
    }

    refreshStatus()

    return () => {
      stopped = true
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [orderNumber, orderFinished])

  return (
    <div className="storefront menu-page">
      <header className="store-header">
        <a className="home-brand" href="/">
          BrewDesk
        </a>

        <nav aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="#menu">Menu</a>
          <a href="#bag">
            Your bag{itemCount > 0 ? ` (${itemCount})` : ''}
          </a>
          <a href="#my-order">Track order</a>
        </nav>
      </header>

      <main>
        <div className="menu-banner">
          <img
            src="/menu-banner.png"
            alt="Freshly brewed. Freshly baked. Find your next café favourite."
          />
        </div>

        <section className="menu-section" id="menu">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <h2>Menu</h2>

            <button
              type="button"
              className="add-drink"
              disabled={menuLoading || placing}
              onClick={() =>
                setMenuVersion((current) => current + 1)
              }
            >
              {menuLoading ? 'Loading…' : 'Refresh menu'}
            </button>
          </div>

          <nav
            className="menu-category-bar"
            aria-label="Menu categories"
          >
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                className={
                  activeCategory === category ? 'active' : ''
                }
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </nav>

          <h3>{activeCategory}</h3>

          {menuError && (
            <p className="checkout-error" role="alert">
              {menuError} Make sure the backend is running, then
              click Refresh menu.
            </p>
          )}

          {menuLoading && <p role="status">Loading menu…</p>}

          {!menuLoading &&
            !menuError &&
            visibleItems.length === 0 && (
              <p>No items in this category yet.</p>
            )}

          <div className="drink-grid">
            {visibleItems.map((item) => (
              <article className="drink-card" key={item.id}>
                <img
                  className="menu-photo"
                  src={imageSource(item.image)}
                  alt={item.name}
                  loading="lazy"
                />

                <h4>{item.name}</h4>
                <p>{item.description}</p>
                <p className="price">{money(item.price)}</p>

                <button
                  type="button"
                  className="add-drink"
                  onClick={() => addItem(item)}
                  disabled={
                    placing ||
                    menuLoading ||
                    Boolean(menuError) ||
                    !item.available ||
                    (bag[item.id]?.quantity || 0) >= 99
                  }
                >
                  {item.available ? 'Add to bag' : 'Sold out'}
                </button>
              </article>
            ))}
          </div>
        </section>

        <div className="bag-order-layout">
          <section className="bag-section" id="bag">
            <h2 className="bag-order-heading">
              <Icon name="bag" />
              Your bag
            </h2>

            {bagItems.length === 0 ? (
              <div className="bag-empty">
                <p>Your bag is empty.</p>
                <a className="bag-menu-link" href="#menu">
                  Browse menu <span aria-hidden="true">→</span>
                </a>
              </div>
            ) : (
              <form onSubmit={placeOrder}>
                <ul className="bag-item-list">
                  {bagItems.map((item) => {
                    const current = menuItems.find(
                      (product) => product.id === item.id,
                    )

                    const changed =
                      !current ||
                      !current.available ||
                      current.archived ||
                      current.price !== item.price ||
                      current.name !== item.name

                    return (
                      <li className="bag-item" key={item.id}>
                        <div>
                          <strong>{item.name}</strong>
                          <span>
                            {item.quantity} × {money(item.price)}
                          </span>

                          {changed && (
                            <>
                              <small>
                                This item changed or is unavailable.
                                Remove it and check the menu.
                              </small>
                              <button
                                type="button"
                                disabled={placing}
                                onClick={() =>
                                  removeAllOfItem(item.id)
                                }
                              >
                                Remove item
                              </button>
                            </>
                          )}
                        </div>

                        <div className="bag-item-actions">
                          <strong>
                            {money(item.price * item.quantity)}
                          </strong>

                          <div className="bag-quantity-controls">
                            <button
                              type="button"
                              aria-label={`Remove one ${item.name}`}
                              onClick={() => removeItem(item.id)}
                              disabled={placing}
                            >
                              −
                            </button>

                            <span>{item.quantity}</span>

                            <button
                              type="button"
                              aria-label={`Add one ${item.name}`}
                              onClick={() =>
                                current && addItem(current)
                              }
                              disabled={
                                placing ||
                                menuLoading ||
                                Boolean(menuError) ||
                                changed ||
                                item.quantity >= 99
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>

                <fieldset
                  className="checkout-fields"
                  disabled={placing}
                >
                  <legend>Order details</legend>

                  <label className="checkout-field">
                    <span>How would you like your order?</span>
                    <select
                      value={fulfilment}
                      onChange={(event) => {
                        setFulfilment(event.target.value)
                        setError('')
                      }}
                    >
                      <option value="pickup">Pickup</option>
                      <option value="delivery">Delivery</option>
                    </select>
                  </label>

                  {fulfilment === 'pickup' ? (
                    <label className="checkout-field">
                      <span>Pickup time</span>
                      <select
                        value={pickupTime}
                        onChange={(event) =>
                          setPickupTime(event.target.value)
                        }
                        required
                      >
                        <option value="16:30">4:30 PM</option>
                        <option value="16:45">4:45 PM</option>
                        <option value="17:00">5:00 PM</option>
                      </select>
                    </label>
                  ) : (
                    <>
                      <label className="checkout-field">
                        <span>Full name</span>
                        <input
                          name="name"
                          value={customer.name}
                          onChange={updateCustomer}
                          autoComplete="name"
                          maxLength={80}
                          required
                        />
                      </label>

                      <label className="checkout-field">
                        <span>Phone number</span>
                        <input
                          name="phone"
                          type="tel"
                          value={customer.phone}
                          onChange={updateCustomer}
                          autoComplete="tel"
                          maxLength={25}
                          required
                        />
                      </label>

                      <label className="checkout-field">
                        <span>Delivery address</span>
                        <input
                          name="address"
                          value={customer.address}
                          onChange={updateCustomer}
                          autoComplete="street-address"
                          maxLength={160}
                          required
                        />
                      </label>

                      <label className="checkout-field">
                        <span>Town or city</span>
                        <input
                          name="city"
                          value={customer.city}
                          onChange={updateCustomer}
                          autoComplete="address-level2"
                          maxLength={80}
                          required
                        />
                      </label>

                      <label className="checkout-field">
                        <span>
                          Landmark or delivery note (optional)
                        </span>
                        <textarea
                          name="note"
                          value={customer.note}
                          onChange={updateCustomer}
                          maxLength={200}
                          rows={3}
                        />
                      </label>
                    </>
                  )}

                  <p className="checkout-payment">
                    <strong>Payment method:</strong>{' '}
                    {fulfilment === 'pickup'
                      ? 'Pay at pickup'
                      : 'Cash on delivery'}
                  </p>

                  <div className="checkout-total">
                    <span>Total</span>
                    <strong>{money(total)}</strong>
                  </div>

                  {bagNeedsReview && (
                    <p role="status">
                      Please remove the changed items and add
                      them again from the refreshed menu.
                    </p>
                  )}

                  <button
                    className="checkout-submit"
                    type="submit"
                    disabled={
                      placing ||
                      menuLoading ||
                      Boolean(menuError) ||
                      bagNeedsReview
                    }
                  >
                    {placing ? 'Placing order…' : 'Place order'}
                  </button>
                </fieldset>

                {error && (
                  <p className="checkout-error" role="alert">
                    {error}
                  </p>
                )}
              </form>
            )}
          </section>

          <section className="my-order" id="my-order">
            <h2 className="bag-order-heading">
              <Icon name="receipt" />
              My order
            </h2>

            {!order ? (
              <p>Place an order to see your details here.</p>
            ) : (
              <div className="customer-order-details">
                <div className="customer-order-top">
                  <h3>Order #{order.number}</h3>
                  <span className="customer-order-status">
                    {statusLabel(order.status, order.fulfilment)}
                  </span>
                </div>

                <p>
                  <strong>Order type:</strong>{' '}
                  {order.fulfilment === 'delivery'
                    ? 'Delivery'
                    : 'Pickup'}
                </p>

                {order.fulfilment === 'pickup' && (
                  <p>
                    <strong>Pickup time:</strong>{' '}
                    {order.pickupTime}
                  </p>
                )}

                <ul className="customer-order-items">
                  {(order.items || []).map((item, index) => (
                    <li key={`${item.menuItemId || item.name}-${index}`}>
                      {item.quantity} × {item.name}
                    </li>
                  ))}
                </ul>

                <p>
                  <strong>Total:</strong> {money(order.total)}
                </p>

                <p>
                  <strong>Payment:</strong>{' '}
                  {order.paidAt
                    ? 'Paid'
                    : order.fulfilment === 'delivery'
                      ? 'Cash on delivery'
                      : 'Pay at pickup'}
                </p>

                {order.fulfilment === 'delivery' &&
                  order.delivery && (
                    <div className="customer-delivery-details">
                      <h4>Delivery details</h4>
                      <p>{order.delivery.name}</p>
                      <p>{order.delivery.phone}</p>

                      <address>
                        {order.delivery.address}
                        <br />
                        {order.delivery.city}
                      </address>

                      {order.delivery.note && (
                        <p>
                          <strong>Delivery note:</strong>{' '}
                          {order.delivery.note}
                        </p>
                      )}
                    </div>
                  )}

                {trackingError && (
                  <p role="status">{trackingError}</p>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
} 