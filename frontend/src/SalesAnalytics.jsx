import { useEffect, useState } from 'react'
import './SalesAnalytics.css'

const CATEGORIES = [
  'All',
  'Drinks',
  'Cakes',
  'Buns & Pastries',
  'Sandwiches',
  'Small Bites',
  'Uncategorised',
]

const CATEGORY_COLOURS = {
  Drinks: '#b94700',
  Cakes: '#d09b5c',
  'Buns & Pastries': '#7c906d',
  Sandwiches: '#ad917b',
  'Small Bites': '#b47d82',
  Uncategorised: '#8a8a80',
}

function Icon({ name, size = 22 }) {
  const shapes = {
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M6 7a7 7 0 0 1 12-2l2 2M4 17l2 2a7 7 0 0 0 12-2" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5" />
        <path d="M4 16v5h16v-5" />
      </>
    ),
    sales: (
      <>
        <ellipse cx="9" cy="6" rx="6" ry="3" />
        <path d="M3 6v8c0 1.7 2.7 3 6 3" />
        <path d="M3 10c0 1.7 2.7 3 6 3" />
        <ellipse cx="16" cy="15" rx="5" ry="2.5" />
        <path d="M11 15v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4" />
      </>
    ),
    orders: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="M9 4V2h6v2M8 12l3 3 5-6" />
      </>
    ),
    items: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="M3 8v9l9 5 9-5V8M12 13v9M7 5.8l9 5" />
      </>
    ),
    average: (
      <>
        <path d="M3 3h3l3 12h10l3-9H7" />
        <circle cx="10" cy="20" r="1" />
        <circle cx="19" cy="20" r="1" />
      </>
    ),
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {shapes[name]}
    </svg>
  )
}

function dateInColombo(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const get = (type) =>
    parts.find((part) => part.type === type).value

  return `${get('year')}-${get('month')}-${get('day')}`
}

function defaultFilters() {
  const to = dateInColombo(new Date())
  const start = new Date(`${to}T00:00:00Z`)
  start.setUTCDate(start.getUTCDate() - 29)

  return {
    from: start.toISOString().slice(0, 10),
    to,
    category: 'All',
    fulfilment: 'All',
  }
}

function validateDates(filters) {
  if (!filters.from || !filters.to) {
    return 'Choose both a start date and an end date.'
  }

  const start = new Date(`${filters.from}T00:00:00Z`)
  const end = new Date(`${filters.to}T00:00:00Z`)
  const days = (end - start) / 86400000 + 1

  if (!Number.isFinite(days) || days < 1 || days > 366) {
    return 'Choose a valid date range of 1 to 366 days.'
  }

  return ''
}

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-LK', {
    maximumFractionDigits: 2,
  })}`
}

function shortNumber(value) {
  if (value >= 1000000) {
    return `${Number((value / 1000000).toFixed(1))}m`
  }

  if (value >= 1000) {
    return `${Number((value / 1000).toFixed(1))}k`
  }

  return Math.round(value).toLocaleString('en-LK')
}

function shortDate(value) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    },
  )
}

function paidDate(value) {
  return new Date(value).toLocaleString('en-GB', {
    timeZone: 'Asia/Colombo',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function hourLabel(hour) {
  return `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`
}

function queryString(filters, extra = {}) {
  return new URLSearchParams({
    ...filters,
    ...extra,
  }).toString()
}

function niceMaximum(value) {
  if (value <= 0) return 1

  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalised = value / magnitude

  const step =
    normalised <= 1
      ? 1
      : normalised <= 2
        ? 2
        : normalised <= 5
          ? 5
          : 10

  return step * magnitude
}

function SalesTrend({ points }) {
  const width = 760
  const height = 280
  const left = 56
  const right = 28
  const top = 22
  const bottom = 42

  const chartWidth = width - left - right
  const chartHeight = height - top - bottom

  const maximum = niceMaximum(
    Math.max(0, ...points.map((point) => point.sales)),
  )

  const x = (index) =>
    left +
    (points.length <= 1
      ? chartWidth / 2
      : (index / (points.length - 1)) * chartWidth)

  const y = (value) =>
    top + chartHeight - (value / maximum) * chartHeight

  const coordinates = points
    .map((point, index) => `${x(index)},${y(point.sales)}`)
    .join(' ')

  const area = points.length
    ? `${x(0)},${top + chartHeight} ${coordinates} ${
        x(points.length - 1)
      },${top + chartHeight}`
    : ''

  const labelCount = Math.min(7, points.length)

  const labels = new Set(
    Array.from({ length: labelCount }, (_, index) =>
      Math.round(
        (index * (points.length - 1)) /
          Math.max(1, labelCount - 1),
      ),
    ),
  )

  return (
    <svg
      className="sales-svg"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Daily paid sales by payment date"
    >
      <title>Daily paid sales by payment date</title>

      {[0, 1, 2, 3, 4].map((step) => {
        const value = (maximum * step) / 4

        return (
          <g key={step}>
            <line
              x1={left}
              x2={width - right}
              y1={y(value)}
              y2={y(value)}
              stroke="#e8dfd4"
            />

            <text
              x={left - 10}
              y={y(value) + 4}
              textAnchor="end"
            >
              {shortNumber(value)}
            </text>
          </g>
        )
      })}

      <polygon points={area} fill="#f6e7d7" />

      <polyline
        points={coordinates}
        fill="none"
        stroke="#b94700"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {points.map((point, index) => (
        <g key={point.date}>
          <circle
            cx={x(index)}
            cy={y(point.sales)}
            r={points.length > 60 ? 2 : 3.5}
            fill="#fffdfa"
            stroke="#b94700"
            strokeWidth="2"
          >
            <title>
              {point.date}: {money(point.sales)}
            </title>
          </circle>

          {labels.has(index) && (
            <text
              x={x(index)}
              y={height - 13}
              textAnchor="middle"
            >
              {shortDate(point.date)}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

function HourlyOrdersChart({ points }) {
  const width = 680
  const height = 260
  const left = 40
  const right = 16
  const top = 20
  const bottom = 44

  const chartWidth = width - left - right
  const chartHeight = height - top - bottom
  const slotWidth = chartWidth / 24

  const maximum = Math.max(
    1,
    ...points.map((point) => point.orders),
  )

  const tickStep = Math.max(1, Math.ceil(maximum / 4))
  const axisMaximum =
    Math.ceil(maximum / tickStep) * tickStep

  const ticks = Array.from(
    { length: axisMaximum / tickStep + 1 },
    (_, index) => index * tickStep,
  )

  const busiest = points.reduce(
    (best, point) =>
      point.orders > best.orders ? point : best,
    { hour: 0, orders: 0 },
  )

  const tied =
    busiest.orders > 0 &&
    points.filter(
      (point) => point.orders === busiest.orders,
    ).length > 1

  return (
    <article className="sales-panel sales-hours-panel">
      <div className="sales-panel-heading">
        <h2>Busiest ordering hours</h2>
        <p>Paid orders by time placed · Asia/Colombo</p>
      </div>

      <svg
        className="sales-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Paid orders by the hour they were placed"
      >
        <title>Paid orders by time placed</title>

        {ticks.map((value) => {
          const position =
            top +
            chartHeight -
            (value / axisMaximum) * chartHeight

          return (
            <g key={value}>
              <line
                x1={left}
                x2={width - right}
                y1={position}
                y2={position}
                stroke="#e8dfd4"
              />

              <text
                x={left - 10}
                y={position + 4}
                textAnchor="end"
              >
                {value}
              </text>
            </g>
          )
        })}

        {Array.from({ length: 24 }, (_, hour) => {
          const count =
            points.find((point) => point.hour === hour)
              ?.orders || 0

          const barHeight =
            (count / axisMaximum) * chartHeight

          return (
            <g key={hour}>
              <rect
                x={left + hour * slotWidth + 3}
                y={top + chartHeight - barHeight}
                width={Math.max(1, slotWidth - 6)}
                height={barHeight}
                rx="3"
                fill={
                  count > 0 && count === busiest.orders
                    ? '#b94700'
                    : '#d09b5c'
                }
              >
                <title>
                  {hourLabel(hour)}: {count}{' '}
                  {count === 1 ? 'order' : 'orders'}
                </title>
              </rect>

              {hour % 3 === 0 && (
                <text
                  x={
                    left +
                    hour * slotWidth +
                    slotWidth / 2
                  }
                  y={height - 14}
                  textAnchor="middle"
                >
                  {hourLabel(hour)}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      <p className="sales-chart-footnote">
        {busiest.orders > 0
          ? `Peak hour: ${hourLabel(busiest.hour)}–${hourLabel(
              (busiest.hour + 1) % 24,
            )} · ${busiest.orders} ${
              busiest.orders === 1 ? 'order' : 'orders'
            }${tied ? ' (joint highest)' : ''}`
          : 'No ordering-time data for this selection.'}
      </p>
    </article>
  )
}

export default function SalesAnalytics() {
  const [filters, setFilters] = useState(defaultFilters)
  const [draft, setDraft] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [refresh, setRefresh] = useState(0)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterError, setFilterError] = useState('')

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      setLoading(true)
      setError('')
      setExportError('')

      try {
        const response = await fetch(
          `/api/staff/analytics?${queryString(filters, { page })}`,
          {
            credentials: 'same-origin',
            cache: 'no-store',
            signal: controller.signal,
          },
        )

        const result = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? 'Your staff session expired. Refresh and sign in again.'
              : result?.error || 'Could not load sales analytics.',
          )
        }

        if (
          !result?.summary ||
          !result?.pagination ||
          !Array.isArray(result.orders) ||
          !Array.isArray(result.trend) ||
          !Array.isArray(result.topItems) ||
          !Array.isArray(result.categorySales) ||
          !Array.isArray(result.orderTypes) ||
          !Array.isArray(result.hourlyOrders)
        ) {
          throw new Error(
            'Analytics data is incomplete. Check the backend file and restart the server.',
          )
        }

        if (!controller.signal.aborted) {
          setData(result)
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
  }, [filters, page, refresh])

  function commitFilters(next) {
    setDraft(next)

    const validationError = validateDates(next)
    setFilterError(validationError)

    if (validationError) return

    setPage(1)
    setExportError('')
    setFilters(next)
  }

  function updateDraft(event) {
    const { name, value } = event.target

    commitFilters({
      ...draft,
      [name]: value,
    })
  }

  function resetFilters() {
    commitFilters(defaultFilters())
  }

  function filterCategory(category) {
    commitFilters({
      ...filters,
      category:
        filters.category === category ? 'All' : category,
    })
  }

  function filterType(type) {
    commitFilters({
      ...filters,
      fulfilment:
        filters.fulfilment === type ? 'All' : type,
    })
  }

  async function exportCsv() {
    if (exporting || loading || filterError) return

    setExporting(true)
    setExportError('')

    try {
      const response = await fetch(
        `/api/staff/analytics?${queryString(filters, {
          format: 'csv',
        })}`,
        {
          credentials: 'same-origin',
          cache: 'no-store',
        },
      )

      if (!response.ok) {
        const result = await response.json().catch(() => null)

        throw new Error(
          response.status === 401
            ? 'Your staff session expired. Refresh and sign in again.'
            : result?.error || 'Could not export sales.',
        )
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download =
        `brewdesk-sales-${filters.from}-to-${filters.to}.csv`

      document.body.appendChild(link)
      link.click()
      link.remove()

      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      setExportError(err.message)
    } finally {
      setExporting(false)
    }
  }

  const summary = data?.summary

  const maximumQuantity = Math.max(
    1,
    ...(data?.topItems || []).map((item) => item.quantity),
  )

  const maximumCategorySales = Math.max(
    1,
    ...(data?.categorySales || []).map((item) => item.sales),
  )

  const categoryRows = (data?.categorySales || []).filter(
    (item) => item.sales > 0,
  )

  const categoryTotal = categoryRows.reduce(
    (sum, item) => sum + item.sales,
    0,
  )

  let categoryPosition = 0

  const categorySlices = categoryRows.map((item) => {
    const start = categoryPosition
    categoryPosition += (item.sales / categoryTotal) * 100

    return `${
      CATEGORY_COLOURS[item.category] || '#8a8a80'
    } ${start}% ${categoryPosition}%`
  })

  const categoryBackground = categorySlices.length
    ? `conic-gradient(${categorySlices.join(', ')})`
    : '#e9ddcf'

  const pickupSales =
    data?.orderTypes.find((item) => item.type === 'pickup')
      ?.sales || 0

  const deliverySales =
    data?.orderTypes.find((item) => item.type === 'delivery')
      ?.sales || 0

  const typeTotal = pickupSales + deliverySales

  const pickupPercentage = typeTotal
    ? (pickupSales / typeTotal) * 100
    : 0

  const kpis = summary
    ? [
        {
          label: 'Paid sales',
          value: money(summary.paidSales),
          icon: 'sales',
        },
        {
          label: 'Paid orders',
          value: summary.paidOrders,
          icon: 'orders',
        },
        {
          label: 'Items sold',
          value: summary.itemsSold,
          icon: 'items',
        },
        {
          label: 'Average order value',
          value: money(summary.averageOrderValue),
          icon: 'average',
        },
      ]
    : []

  return (
    <section className="sales-page">
      <header className="sales-header">
        <div>
          <p className="sales-eyebrow">BREWDESK INSIGHTS</p>
          <h1>Sales Analytics</h1>
          <p className="sales-subtitle">
            Your café performance at a glance.
          </p>
        </div>

        <div className="sales-actions">
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              setRefresh((current) => current + 1)
            }
          >
            <Icon name="refresh" size={18} />
            Refresh
          </button>

          <button
            className="sales-primary"
            type="button"
            onClick={exportCsv}
            disabled={
              loading ||
              exporting ||
              Boolean(error) ||
              Boolean(filterError) ||
              !data
            }
          >
            <Icon name="download" size={18} />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </header>

      <div className="sales-filters">
        <label>
          From
          <input
            type="date"
            name="from"
            value={draft.from}
            onChange={updateDraft}
            required
          />
        </label>

        <label>
          To
          <input
            type="date"
            name="to"
            value={draft.to}
            onChange={updateDraft}
            required
          />
        </label>

        <label>
          Category
          <select
            name="category"
            value={draft.category}
            onChange={updateDraft}
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category === 'All'
                  ? 'All categories'
                  : category}
              </option>
            ))}
          </select>
        </label>

        <label>
          Order type
          <select
            name="fulfilment"
            value={draft.fulfilment}
            onChange={updateDraft}
          >
            <option value="All">All types</option>
            <option value="pickup">Pickup</option>
            <option value="delivery">Delivery</option>
          </select>
        </label>

        <button
          className="sales-reset"
          type="button"
          onClick={resetFilters}
        >
          Reset filters
        </button>
      </div>

      {filterError && (
        <p className="sales-error" role="alert">
          {filterError} Charts retain the last valid selection.
        </p>
      )}

      {exportError && (
        <p className="sales-error" role="alert">
          {exportError}
        </p>
      )}

      {loading ? (
        <div className="sales-loading" role="status">
          Loading your café insights…
        </div>
      ) : error ? (
        <p className="sales-error" role="alert">
          {error}
        </p>
      ) : data ? (
        <>
          <div className="sales-context">
            <span>Paid orders · Payment date · Asia/Colombo</span>
            <span>
              {shortDate(filters.from)} – {shortDate(filters.to)}
              {' · '}
              {filters.category === 'All'
                ? 'All categories'
                : filters.category}
              {' · '}
              {filters.fulfilment === 'All'
                ? 'All types'
                : filters.fulfilment === 'pickup'
                  ? 'Pickup'
                  : 'Delivery'}
            </span>
          </div>

          <div className="sales-kpis">
            {kpis.map((kpi) => (
              <article key={kpi.label}>
                <span className="sales-kpi-icon">
                  <Icon name={kpi.icon} size={28} />
                </span>

                <div className="sales-kpi-copy">
                  <span>{kpi.label}</span>
                  <strong>{kpi.value}</strong>
                </div>
              </article>
            ))}
          </div>

          {filters.category !== 'All' && (
            <p className="sales-note">
              Revenue and average value include only{' '}
              {filters.category} items within matching paid orders.
            </p>
          )}

          {summary.paidOrders === 0 ? (
            <div className="sales-panel sales-empty">
              <Icon name="orders" size={36} />
              <h2>No paid sales in this selection</h2>
              <p>
                Try another date range or reset the filters.
                Orders appear after staff mark payment as paid.
              </p>
              <button type="button" onClick={resetFilters}>
                Reset filters
              </button>
            </div>
          ) : (
            <>
              <div className="sales-chart-grid">
                <article className="sales-panel sales-trend-panel">
                  <div className="sales-panel-heading">
                    <h2>Sales trend</h2>
                    <p>Paid sales by payment date · Rs.</p>
                  </div>

                  <SalesTrend points={data.trend} />
                </article>

                <article className="sales-panel sales-top-panel">
                  <div className="sales-panel-heading">
                    <h2>Best-selling items</h2>
                    <p>Items sold within paid orders</p>
                  </div>

                  <div className="sales-ranking">
                    {data.topItems.map((item, index) => (
                      <div
                        className="sales-ranking-row"
                        key={item.id}
                      >
                        <span className="sales-ranking-name">
                          {item.name}
                        </span>

                        <div className="sales-ranking-track">
                          <div
                            className="sales-ranking-fill"
                            style={{
                              width:
                                `${(item.quantity / maximumQuantity) * 100}%`,
                              opacity: Math.max(
                                0.45,
                                1 - index * 0.12,
                              ),
                            }}
                            title={
                              `${item.quantity} sold · ${money(item.sales)}`
                            }
                          />
                        </div>

                        <strong>{item.quantity}</strong>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="sales-panel sales-category-panel">
                  <div className="sales-panel-heading">
                    <h2>Category sales</h2>
                    <p>Click a category to filter; click again to clear.</p>
                  </div>

                  <div className="sales-category-bars">
                    {data.categorySales.map((item) => (
                      <button
                        className="sales-category-row"
                        key={item.category}
                        type="button"
                        aria-pressed={
                          filters.category === item.category
                        }
                        onClick={() =>
                          filterCategory(item.category)
                        }
                      >
                        <span className="sales-bar-label">
                          <span>{item.category}</span>
                          <strong>{money(item.sales)}</strong>
                        </span>

                        <span className="sales-bar-track">
                          <span
                            className="sales-bar-fill"
                            style={{
                              width:
                                `${(item.sales / maximumCategorySales) * 100}%`,
                              background:
                                CATEGORY_COLOURS[item.category] ||
                                '#8a8a80',
                            }}
                          />
                        </span>
                      </button>
                    ))}
                  </div>
                </article>

                <article className="sales-panel sales-share-panel">
                  <div className="sales-panel-heading">
                    <h2>Category sales share</h2>
                    <p>Share of revenue in the current selection</p>
                  </div>

                  <div className="sales-category-pie-layout">
                    <div
                      className="sales-category-pie"
                      role="img"
                      aria-label={
                        categoryRows
                          .map(
                            (item) =>
                              `${item.category}: ${money(item.sales)}, ` +
                              `${((item.sales / categoryTotal) * 100).toFixed(1)} percent`,
                          )
                          .join('; ') || 'No category sales'
                      }
                      style={{
                        background: categoryBackground,
                      }}
                    />

                    <div className="sales-category-pie-legend">
                      <div className="sales-legend-heading">
                        <span>Category</span>
                        <span>Sales / Share</span>
                      </div>

                      {categoryRows.map((item) => (
                        <button
                          key={item.category}
                          type="button"
                          aria-pressed={
                            filters.category === item.category
                          }
                          onClick={() =>
                            filterCategory(item.category)
                          }
                        >
                          <span className="sales-category-pie-name">
                            <span
                              className="sales-category-pie-dot"
                              style={{
                                background:
                                  CATEGORY_COLOURS[
                                    item.category
                                  ] || '#8a8a80',
                              }}
                              aria-hidden="true"
                            />
                            {item.category}
                          </span>

                          <span className="sales-category-pie-value">
                            <strong>{money(item.sales)}</strong>
                            <small>
                              {(
                                (item.sales / categoryTotal) *
                                100
                              ).toFixed(1)}
                              %
                            </small>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </article>

                <article className="sales-panel sales-type-panel">
                  <div className="sales-panel-heading">
                    <h2>Order type</h2>
                    <p>Paid sales by order type · Click to filter</p>
                  </div>

                  <div className="sales-type-layout">
                    <div
                      className="sales-donut"
                      role="img"
                      aria-label={
                        typeTotal
                          ? `Pickup ${pickupPercentage.toFixed(1)} percent, ` +
                            `delivery ${(100 - pickupPercentage).toFixed(1)} percent`
                          : 'No sales'
                      }
                      style={{
                        background: typeTotal
                          ? `conic-gradient(
                              #b94700 0% ${pickupPercentage}%,
                              #7c906d ${pickupPercentage}% 100%
                            )`
                          : '#e9ddcf',
                      }}
                    >
                      <div>
                        <strong>{summary.paidOrders}</strong>
                        <span>paid orders</span>
                      </div>
                    </div>

                    <div className="sales-type-legend">
                      {[
                        ['pickup', 'Pickup', pickupSales],
                        ['delivery', 'Delivery', deliverySales],
                      ].map(([type, label, sales]) => (
                        <button
                          key={type}
                          type="button"
                          aria-pressed={
                            filters.fulfilment === type
                          }
                          onClick={() => filterType(type)}
                        >
                          <span className="sales-type-name">
                            <i
                              className={`sales-dot ${type}`}
                              aria-hidden="true"
                            />
                            {label}
                          </span>

                          <span className="sales-type-value">
                            <strong>{money(sales)}</strong>
                            <small>
                              {(
                                typeTotal
                                  ? (sales / typeTotal) * 100
                                  : 0
                              ).toFixed(1)}
                              %
                            </small>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </article>

                <HourlyOrdersChart points={data.hourlyOrders} />
              </div>

              <section className="sales-panel sales-details">
                <div className="sales-table-heading">
                  <div className="sales-panel-heading">
                    <h2>Sales details</h2>
                    <p>Transactions in the current selection</p>
                  </div>

                  <span className="sales-count-badge">
                    {data.pagination.totalOrders} paid orders
                  </span>
                </div>

                <div className="sales-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Order</th>
                        <th scope="col">Paid date</th>
                        <th scope="col">Type</th>
                        <th scope="col">Items</th>
                        <th scope="col">
                          {filters.category === 'All'
                            ? 'Total'
                            : 'Category sales'}
                        </th>
                        <th scope="col">Payment</th>
                      </tr>
                    </thead>

                    <tbody>
                      {data.orders.map((order) => (
                        <tr key={order.number}>
                          <td className="sales-order-number">
                            #{order.number}
                          </td>

                          <td>{paidDate(order.paidAt)}</td>

                          <td>
                            <span className="sales-order-type">
                              {order.fulfilment === 'delivery'
                                ? 'Delivery'
                                : 'Pickup'}
                            </span>
                          </td>

                          <td>
                            {order.items.map((item, index) => (
                              <div
                                className="sales-table-item"
                                key={index}
                              >
                                {item.quantity} × {item.name}
                              </div>
                            ))}
                          </td>

                          <td className="sales-table-total">
                            {money(order.total)}
                          </td>

                          <td>
                            <span className="sales-paid">
                              Paid
                            </span>
                          </td>
                        </tr>
                      ))}

                      {data.orders.length === 0 && (
                        <tr>
                          <td colSpan={6}>
                            No orders on this page. Return to
                            the previous page.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="sales-pagination">
                  <span>
                    Page {data.pagination.page} of{' '}
                    {Math.max(1, data.pagination.totalPages)}
                    {' · '}
                    {data.pagination.totalOrders} paid orders
                  </span>

                  <div className="sales-actions">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() =>
                        setPage((current) =>
                          Math.max(1, current - 1),
                        )
                      }
                    >
                      Previous
                    </button>

                    <button
                      type="button"
                      disabled={
                        page >= data.pagination.totalPages
                      }
                      onClick={() =>
                        setPage((current) => current + 1)
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}
        </>
      ) : null}
    </section>
  )
} 