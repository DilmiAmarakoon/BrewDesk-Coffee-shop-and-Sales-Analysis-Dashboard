import { useState } from 'react'

const statusLabels = {
  received: 'Received',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  collected: 'Collected',
}

const numberFormat = new Intl.NumberFormat('en-LK')

export default function PickupDesk() {
  const [orders, setOrders] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadOrders() {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/orders', {
        cache: 'no-store',
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || !Array.isArray(result)) {
        throw new Error(result?.error ?? 'Could not load orders.')
      }

      setOrders(result)
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function updateStatus(number, status) {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/orders/${number}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || !result) {
        throw new Error(result?.error ?? 'Could not update the order.')
      }

      setOrders((current) =>
        current.map((order) =>
          order.number === number ? result : order,
        ),
      )
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="pickup-desk" id="pickup-desk">
      <h2>Pickup &amp; Delivery Desk</h2>

      <button
        className="primary-button"
        type="button"
        onClick={loadOrders}
        disabled={isLoading}
      >
        {isLoading ? 'Please wait…' : 'Refresh orders'}
      </button>

      {error && <p role="alert">{error}</p>}
      {orders?.length === 0 && <p>No orders yet.</p>}

      {orders?.map((order) => {
        const isDelivery = order.fulfilment === 'delivery'
        let action = null

        if (order.status === 'received') {
          action = { status: 'preparing', label: 'Start preparing' }
        } else if (order.status === 'preparing') {
          action = {
            status: 'ready',
            label: isDelivery ? 'Ready for dispatch' : 'Mark ready',
          }
        } else if (order.status === 'ready' && isDelivery) {
          action = {
            status: 'out_for_delivery',
            label: 'Out for delivery',
          }
        } else if (
          order.status === 'ready' ||
          order.status === 'out_for_delivery'
        ) {
          if (!order.paidAt) {
            action = { status: 'paid', label: 'Mark cash received' }
          } else {
            action = {
              status: isDelivery ? 'delivered' : 'collected',
              label: isDelivery ? 'Mark delivered' : 'Mark collected',
            }
          }
        }

        return (
          <article className="pickup-row" key={order.number}>
            <strong>
              #{order.number} · {isDelivery ? 'Delivery' : 'Pickup'}
            </strong>

            {!isDelivery && <p>Pickup time · {order.pickupTime}</p>}

            <p>
              {order.items.map((item) =>
                `${item.quantity} × ${item.name}`,
              ).join(', ')}
            </p>

            <p>
              Total · Rs. {numberFormat.format(order.total)}
              {' · '}
              {order.paidAt ? 'Paid' : 'Unpaid'}
            </p>

            {isDelivery && order.delivery && (
              <div>
                <p>
                  {order.delivery.name} · {order.delivery.phone}
                </p>
                <p>
                  {order.delivery.address}, {order.delivery.city}
                </p>
                {order.delivery.note && (
                  <p>Delivery note · {order.delivery.note}</p>
                )}
              </div>
            )}

            <p className="order-status">
              {order.status === 'ready' && isDelivery
                ? 'Ready for dispatch'
                : statusLabels[order.status] ?? order.status}
            </p>

            {action && (
              <button
                className="primary-button"
                type="button"
                disabled={isLoading}
                onClick={() =>
                  updateStatus(order.number, action.status)
                }
              >
                {action.label}
              </button>
            )}
          </article>
        )
      })}
    </section>
  )
} 