# ☕ BrewDesk

### Coffee, cakes & data-driven café insights.

**BrewDesk** is a full-stack café ordering and sales analytics web application built with **React, Node.js, Express, and MongoDB Atlas**.

It brings customer ordering, café operations, menu management, and interactive sales reporting into one platform.

Customers can browse café favourites, choose pickup or delivery, and follow their orders. Staff can manage orders, update products, record payments, and analyse sales performance.

> This is an educational portfolio project configured for local development. Payments are recorded manually for pay-at-pickup and cash-on-delivery orders.

---

## 🎯 Project Objectives

- Make café ordering convenient for customers.
- Organise pickup and delivery orders in one staff interface.
- Allow staff to manage products, prices, images, and availability.
- Transform order records into useful sales insights.
- Preserve historical order prices when the menu changes.
- Combine full-stack development with practical data analytics.

---

## 👥 Users and Stakeholders

| Stakeholder | Responsibilities |
|---|---|
| Customers | Browse products, manage a bag, place orders, and follow order progress. |
| Café staff | Prepare orders, update statuses, record payments, and manage collection or delivery. |
| Café owner / manager | Maintain the menu and review business performance. |
| Developer / maintainer | Maintain the application, database integration, and configuration. |

The application currently provides a public customer storefront and a shared authenticated staff area. Separate owner and staff permission levels are not implemented.

---

## 🛍️ Customer Features

### Menu Browsing

- Browse products by category:
  - Drinks
  - Cakes
  - Buns & Pastries
  - Sandwiches
  - Small Bites
- View product images, descriptions, and prices.
- Load the current menu from MongoDB through the backend.
- See sold-out items with ordering disabled.
- View prices in Sri Lankan rupees.

### Shopping Bag

- Add products to the bag.
- Increase or decrease quantities.
- Remove products.
- View the calculated total.
- Retain the bag after refreshing or navigating between pages.
- Review products when their price or availability changes.

### Checkout

- Choose pickup or delivery.
- Select a configured pickup time.
- Enter delivery details:
  - Full name
  - Phone number
  - Address
  - Town or city
  - Optional delivery note
- Choose the relevant payment arrangement:
  - Pay at pickup
  - Cash on delivery

### Order Tracking

- View the latest order number and details.
- Receive automatic status updates while an order is active.
- View payment status.
- Retain the latest order within the browser tab’s session.

### Café Information

- Branch address
- Opening hours
- Google Maps directions link
- Clickable telephone and email links

---

## 🔐 Staff Features

### Shop Overview

- Today’s paid sales
- Today’s paid order count
- Received, preparing, and ready order counts
- Out-for-delivery order count
- Recent orders

### Order Management

- View pickup and delivery orders.
- Review ordered products and quantities.
- Access delivery details when applicable.
- Update preparation and fulfilment statuses.
- Record payments.
- Complete collection or delivery.

### Order Workflows

| Order Type | Workflow |
|---|---|
| Pickup | Received → Preparing → Ready → Collected |
| Delivery | Received → Preparing → Ready → Out for delivery → Delivered |

Payment is recorded separately from preparation status.

An order must be marked paid before it can be completed as collected or delivered.

### Menu Management

- Add products.
- Edit product names and descriptions.
- Assign categories.
- Update whole-rupee prices.
- Upload product images.
- Mark products available or sold out.
- Archive and restore products.
- Search by product name.
- Filter by category.
- Include archived products when needed.

Supported image uploads:

- PNG
- JPEG
- WebP
- Maximum upload size: 5 MB

---

## 📊 Sales Analytics Dashboard

BrewDesk includes an interactive sales dashboard inspired by business intelligence tools.

It uses custom SVG charts and CSS-based pie and donut visuals within React. It is not an embedded Power BI report.

### KPI Cards

| Metric | Calculation |
|---|---|
| Paid sales | Revenue from matching paid order items |
| Paid orders | Number of distinct matching paid orders |
| Items sold | Total quantity of matching paid order items |
| Average order value | Matching sales divided by matching paid orders |

### Charts

| Chart | Purpose |
|---|---|
| Sales trend | Explore daily paid revenue |
| Best-selling items | Identify the top five products by units sold |
| Category sales | Compare revenue across product categories |
| Category sales share | View each category’s percentage of selected revenue |
| Order type | Compare pickup and delivery revenue |
| Busiest ordering hours | Identify when matching paid orders were placed |

### Interactive Features

- Start-date and end-date filters
- Category filter
- Pickup and delivery filter
- Automatic updates after valid filter changes
- Category filtering through chart buttons and legends
- Order-type filtering through the legend
- Reset filters
- Refresh data
- Paginated sales details
- CSV export of all matching orders

### Analytics Rules

- Reporting uses **Asia/Colombo** time.
- Sales analytics includes orders with a valid `paidAt` date.
- Date filters apply to the payment date.
- Daily trends include zero-sales days.
- Busiest ordering hours use the hour of `createdAt`.
- Each order is counted once in the hourly chart, even if it contains multiple products.
- Historical sales use prices saved in the order, not current menu prices.
- Category-filtered revenue includes only matching items.
- Category-filtered average value divides matching-item revenue by matching paid orders.
- New orders retain product-category snapshots.
- Older orders use matching menu categories where possible.
- Unmatched historical products appear as **Uncategorised**.
- Supported reporting date range: **1–366 days**.

> Historical categories inferred from the current menu may reflect later category edits. The dashboard reports sales revenue, not profit.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript |
| Styling | CSS |
| Charts | Custom SVG and CSS pie/donut charts |
| Icons | Inline SVG |
| Backend | Node.js, Express |
| Database | MongoDB Atlas |
| Database connection | Mongoose with MongoDB collection operations |
| Authentication | express-session |
| Credential comparison | Node.js crypto hashing and timing-safe comparison |
| Bag persistence | localStorage |
| Latest-order persistence | sessionStorage |
| Image storage | Local backend filesystem |
| Data export | CSV |

---

## 🧭 Application Pages

| Route | Page | Access |
|---|---|---|
| `/` | Café homepage | Public |
| `/menu` | Menu, bag, checkout, and latest order | Public |
| `/shop-overview` | Operational overview | Staff |
| `/pickup-desk` | Pickup and delivery order desk | Staff |
| `/menu-management` | Product administration | Staff |
| `/sales-analytics` | Sales dashboard | Staff |

---

## 📁 Important Project Files

Paths are relative to the project root.

| Path | Purpose |
|---|---|
| `backend/server.js` | Backend startup, sessions, menu APIs, checkout, and order actions |
| `backend/salesAnalytics.js` | Sales calculations, filtering, and CSV export |
| `backend/package.json` | Backend dependencies |
| `backend/.env` | Local environment variables; excluded from GitHub |
| `backend/uploads/menu/` | Runtime image uploads; excluded from GitHub |
| `frontend/src/main.jsx` | Page selection and admin navigation |
| `frontend/src/Home.jsx` | Public homepage |
| `frontend/src/App.jsx` | Customer menu, bag, checkout, and tracking |
| `frontend/src/StaffGate.jsx` | Staff authentication interface |
| `frontend/src/PickupDesk.jsx` | Order management |
| `frontend/src/ShopOverview.jsx` | Operational summary |
| `frontend/src/MenuManagement.jsx` | Menu administration |
| `frontend/src/SalesAnalytics.jsx` | Sales dashboard |
| `frontend/src/SalesAnalytics.css` | Dashboard styling |
| `frontend/src/App.css` | Shared application styling |
| `frontend/public/menu/` | Original product images |
| `frontend/public/menu-banner.png` | Menu banner |
| `.gitignore` | Files excluded from Git tracking |

---

## 🚀 Running the Project Locally

### Prerequisites

- Node.js 24, as used during development
- npm
- MongoDB Atlas cluster
- MongoDB database user
- Network access to the cluster
- VS Code or another code editor

Download or clone the repository and open the project folder.

### 1. Install Backend Dependencies

From the project root:

```powershell
cd backend
npm install
```

### 2. Install Frontend Dependencies

Open a second terminal from the project root:

```powershell
cd frontend
npm install
```

### 3. Configure Environment Variables

Create a file named `.env` inside `backend`.

```dotenv
MONGO_URI="your_mongodb_connection_string"
STAFF_USERNAME="your_staff_username"
STAFF_PASSWORD="your_unique_staff_password"
SESSION_SECRET="your_long_random_session_secret"
```

Replace the placeholder values with your own configuration.

Generate a random session secret using:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Add the backend machine’s current public IP address to your MongoDB Atlas project’s IP access list.

If the database password contains reserved URI characters, URL-encode the password portion of the connection string.

The backend connects to the database named `brewdesk`.

**Do not upload `.env` or real credentials to GitHub.**

### 4. Check the Frontend Proxy

The Vite development server must forward `/api` requests to the backend.

The relevant configuration in `frontend/vite.config.js` is:

```js
server: {
  proxy: {
    '/api': 'http://127.0.0.1:5000',
  },
},
```

Keep the existing React plugin and other required configuration.

Uploaded product images currently load from:

```text
http://127.0.0.1:5000/uploads/menu/...
```

This local address needs to be changed or proxied before deployment.

### 5. Start the Backend

From the `backend` folder:

```powershell
node --env-file=.env server.js
```

Expected startup messages:

```text
MongoDB connected to brewdesk
BrewDesk API is running at http://127.0.0.1:5000
```

On the first successful menu migration:

```text
Initial menu saved to MongoDB (17 items)
```

The original menu is inserted once. Restarting the backend preserves later product edits, availability changes, and archives.

### 6. Start the Frontend

From the `frontend` folder:

```powershell
npm run dev
```

Open the URL printed by Vite, commonly:

```text
http://localhost:5173
```

Vite may choose another port if that port is already in use.

Keep both terminals running.

### 7. Open the Staff Area

Visit:

```text
http://localhost:5173/shop-overview
```

Use the actual frontend port if different.

Sign in using the credentials configured in `backend/.env`.

Staff sessions currently use an in-memory store. Restarting the backend requires signing in again.

---

## 🖼️ Product Images and Database Content

- Original menu images are included in `frontend/public/menu/`.
- Uploaded images are stored in `backend/uploads/menu/`.
- Products and orders are stored in MongoDB.
- Cloning the repository does not copy the original installation’s database.
- A fresh database starts with the original 17 products.
- Later products belong to the database used by that installation.
- If runtime uploads are excluded from GitHub, another installation needs its own uploads or a separate copy of those image files.

---

## 🔌 API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check API availability |
| POST | `/api/staff/login` | Staff sign-in |
| GET | `/api/staff/session` | Check staff session |
| POST | `/api/staff/logout` | Staff sign-out |
| GET | `/api/menu` | Load the public menu |
| GET | `/api/staff/menu` | Load the staff menu, including archived products |
| POST | `/api/staff/menu` | Add a product |
| PATCH | `/api/staff/menu/:id` | Edit a product |
| PATCH | `/api/staff/menu/:id/availability` | Update availability |
| PATCH | `/api/staff/menu/:id/archive` | Archive or restore |
| POST | `/api/staff/menu-image` | Upload a product image |
| POST | `/api/orders` | Place an order |
| GET | `/api/orders` | Load staff order list |
| GET | `/api/orders/:number/status` | Read order status and payment state |
| PATCH | `/api/orders/:number/status` | Perform a staff order action |
| GET | `/api/staff/analytics` | Load filtered analytics |
| GET | `/api/staff/analytics?format=csv` | Export matching sales |

Menu administration, analytics, staff order lists, and staff order actions require an authenticated staff session.

### Analytics Parameters

| Parameter | Format |
|---|---|
| `from` | `YYYY-MM-DD` |
| `to` | `YYYY-MM-DD`, inclusive |
| `category` | `All` or a supported category |
| `fulfilment` | `All`, `pickup`, or `delivery` |
| `page` | Page number starting at 1 |
| `format` | `json` or `csv` |

Example:

```text
/api/staff/analytics?from=2026-11-01&to=2026-11-18&category=All&fulfilment=pickup&page=1
```

Image uploads send the image file directly in the request body with the matching `Content-Type`. The endpoint does not accept multipart `FormData`.

---

## 🗄️ Database Collections

| Collection | Stores |
|---|---|
| `menuItems` | Product details, prices, images, availability, and archive state |
| `orders` | Order details, product snapshots, totals, statuses, and timestamps |
| `counters` | Persistent order numbers |
| `migrations` | Completion of the original menu seed |

Checkout validates product availability and quantities and calculates prices on the backend.

Saved order items retain purchase-time names and prices, so later menu edits do not rewrite historical sales.

---

## ✅ Manual Verification Checklist

This checklist describes checks to perform; it does not claim that an automated end-to-end test suite is included.

- [ ] Load the customer menu.
- [ ] Add a product through Menu Management.
- [ ] Confirm it appears in the correct customer category.
- [ ] Upload an image and verify it displays.
- [ ] Mark a product sold out and confirm ordering is blocked.
- [ ] Archive and restore a product.
- [ ] Refresh the page and verify the shopping bag remains.
- [ ] Place a pickup order.
- [ ] Place a delivery order.
- [ ] Refresh and verify the latest order remains in the same tab session.
- [ ] Update order statuses from the staff desk.
- [ ] Record payment and complete collection or delivery.
- [ ] Confirm unpaid orders are excluded from sales analytics.
- [ ] Check dashboard filters and CSV export.
- [ ] Sign out and confirm protected APIs require authentication.

---

## ⚠️ Current Limitations

- Configured for local development.
- Shared environment-configured staff credentials.
- In-memory staff sessions reset after backend restarts.
- Fixed pickup slots: 4:30 PM, 4:45 PM, and 5:00 PM.
- No online card payment gateway.
- No delivery-zone restrictions, distance-based fees, or live GPS tracking.
- No customer accounts or account-based order history.
- Public status lookup uses an order number.
- Bag persistence is specific to the browser and device.
- Latest-order persistence is limited to the browser tab session.
- Product uploads are stored on the local filesystem.
- Older category reports may rely on current menu matching.
- No product-cost, refund, tax, or profit accounting model.
- Checkout availability checks are not an inventory reservation system.

---

## 🔮 Future Improvements

- Dynamic pickup times based on opening hours and preparation capacity.
- Delivery zones and configurable delivery fees.
- Improved phone-number validation.
- Customer accounts and private order history.
- Private order-tracking tokens.
- Online payments with verified payment callbacks.
- Persistent staff sessions and separate staff roles.
- Stronger credential storage and login rate limiting.
- Cloud product-image storage.
- Environment-based API configuration.
- Cancellation and refund workflows.
- Product costs and profit-margin analysis.
- Automated integration tests.
- Hosted deployment.

---

## 👩‍💻 Author

**Dilmi Amarakoon**  
Data Science Undergraduate | SLIIT

BrewDesk combines full-stack web development with practical sales analytics—from capturing café orders to exploring product performance and ordering patterns.

---

## 🎨 Visual Assets

Some product images and design concepts were created with AI assistance.

Illustrative product images should be checked against the actual products served before commercial use.

---

## 📄 License

No license is assigned by this README.

Refer to the repository’s `LICENSE` file if one is added by the author.
