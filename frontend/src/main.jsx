import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import SalesAnalytics from './SalesAnalytics.jsx'

import Home from './Home.jsx'
import App from './App.jsx'
import PickupDesk from './PickupDesk.jsx'
import ShopOverview from './ShopOverview.jsx'
import StaffGate from './StaffGate.jsx'
import MenuManagement from './MenuManagement.jsx'

function BrewDeskPage() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'

  if (path === '/') {
    return <Home />
  }

  if (path === '/menu') {
    return <App />
  }

  const adminPages = {
  '/shop-overview': <ShopOverview />,
  '/pickup-desk': <PickupDesk />,
  '/menu-management': <MenuManagement />,
  '/sales-analytics': <SalesAnalytics />,
}

  if (Object.prototype.hasOwnProperty.call(adminPages, path)) {
    return (
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <a className="admin-brand" href="/shop-overview">
            <svg
              className="admin-coffee-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
              <path d="M16 10h2a3 3 0 0 1 0 6h-2" />
              <path d="M7 3v3M11 2v4M15 3v3" />
            </svg>
            <span>BrewDesk</span>
          </a>

          <nav aria-label="Admin navigation">
  <a
    href="/shop-overview"
    aria-current={
      path === '/shop-overview' ? 'page' : undefined
    }
  >
    Overview
  </a>

  <a
    href="/pickup-desk"
    aria-current={
      path === '/pickup-desk' ? 'page' : undefined
    }
  >
    Orders
  </a>

  <a
    href="/menu-management"
    aria-current={
      path === '/menu-management' ? 'page' : undefined
    }
  >
    Menu Management
  </a>

  <a
    href="/sales-analytics"
    aria-current={
      path === '/sales-analytics' ? 'page' : undefined
    }
  >
    Sales Analytics
  </a>
</nav>

          <a className="admin-store-link" href="/">
            Open storefront
          </a>
        </aside>

        <main className="admin-content">
          <StaffGate>{adminPages[path]}</StaffGate>
        </main>
      </div>
    )
  }

  return (
    <main className="storefront">
      <h1>Page unavailable</h1>
      <a className="primary-button" href="/">
        Go to BrewDesk
      </a>
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrewDeskPage />
  </StrictMode>,
) 