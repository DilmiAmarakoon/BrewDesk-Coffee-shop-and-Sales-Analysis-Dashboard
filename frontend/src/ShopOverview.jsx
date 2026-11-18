import { useEffect, useState } from 'react'

const money = new Intl.NumberFormat('en-LK')
const shopDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Colombo',
})

const statusLabels = {
  received: 'Received',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for delivery',
  collected: 'Collected',
  delivered: 'Delivered',
}

export default function ShopOverview() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadOrders(signal) {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/orders', {
        cache: 'no-store',
        signal,
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || !Array.isArray(result)) {
        throw new Error(result?.error ?? 'Could not load the overview.')
      }

      if (!signal?.aborted) setOrders(result)
    } catch (error) {
      if (!signal?.aborted) setError(error.message)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    loadOrders(controller.signal)

    return () => controller.abort()
  }, [])

  const today = shopDate.format(new Date())

  const paidToday = orders.filter(
    (order) =>
      order.paidAt &&
      shopDate.format(new Date(order.paidAt)) === today,
  )

  const sales = paidToday.reduce((sum, order) => sum + order.total, 0)

  const recentOrders = [...orders]
    .sort((a, b) => b.number - a.number)
    .slice(0, 5)

  return (
    <section className="orders-overview">
      <div className="orders-overview-header">
        <div>
          <h1>Shop Overview</h1>
          <p>Today’s sales and current orders</p>
        </div>

        <div className="orders-overview-totals">
          <div>
            <span>Paid sales today</span>
            <strong>
              {loading ? '…' : `Rs. ${money.format(sales)}`}
            </strong>
          </div>
          <div>
            <span>Orders paid today</span>
            <strong>{loading ? '…' : paidToday.length}</strong>
          </div>
        </div>
      </div>

      <button
        className="primary-button"
        type="button"
        disabled={loading}
        onClick={() => loadOrders()}
      >
        {loading ? 'Loading…' : 'Refresh overview'}
      </button>

      {error && <p role="alert">{error}</p>}

      <div className="orders-overview-grid" aria-busy={loading}>
        <article className="orders-overview-panel">
          <h2>Order status</h2>

          <div className="orders-status-grid">
            {['received', 'preparing', 'ready'].map((status) => (
              <div className="orders-status-card" key={status}>
                <span>{statusLabels[status]}</span>
                <strong>
                  {loading
                    ? '…'
                    : orders.filter((order) => order.status === status).length}
                </strong>
              </div>
            ))}
          </div>

          <p className="orders-dispatch-count">
            Out for delivery ·{' '}
            {loading
              ? '…'
              : orders.filter(
                  (order) => order.status === 'out_for_delivery',
                ).length}
          </p>
        </article>

        <article className="orders-overview-panel">
          <div className="orders-panel-heading">
            <h2>Recent orders</h2>
            <a href="/pickup-desk">View orders →</a>
          </div>

          <div className="orders-overview-table-wrap">
            <table className="orders-overview-table">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Type</th>
                  <th scope="col">Total</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.number}>
                    <td>#{order.number}</td>
                    <td>
                      <span className="orders-type">
                        {order.fulfilment === 'delivery'
                          ? 'Delivery'
                          : 'Pickup'}
                      </span>
                    </td>
                    <td>Rs. {money.format(order.total)}</td>
                    <td>
                      <span
                        className={`orders-badge orders-badge-${order.status}`}
                      >
                        {statusLabels[order.status] ?? order.status}
                      </span>
                    </td>
                  </tr>
                ))}

                {!loading && recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4}>No orders yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  )
} 