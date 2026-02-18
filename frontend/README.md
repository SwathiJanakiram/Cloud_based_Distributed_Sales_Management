# SalesCloud Frontend

React + Vite + Bootstrap frontend for the Cloud-Based Distributed Sales Analytics System.

---

## 📁 Project Structure

```
src/
├── config/
│   └── firebase.js          # Firebase initialization
├── context/
│   └── AuthContext.jsx      # Auth state + role management
├── services/
│   └── api.js               # Axios instance + all API calls
├── components/
│   ├── DashboardLayout.jsx  # Sidebar + main shell
│   ├── ProtectedRoute.jsx   # Auth + role guard
│   ├── KpiCard.jsx          # Reusable metric card
│   └── Topbar.jsx           # Page header bar
├── pages/
│   ├── LoginPage.jsx        # Firebase email/password login
│   ├── AdminDashboard.jsx   # Full analytics (admin only)
│   ├── ManagerDashboard.jsx # Regional analytics (manager)
│   ├── SalesDashboard.jsx   # New sale form (all roles)
│   ├── UsersPage.jsx        # User management (admin only)
│   ├── ProductsPage.jsx     # Product catalog (all roles)
│   ├── StoresPage.jsx       # Store list/create (admin+manager)
│   └── NotFoundPage.jsx     # 404 fallback
├── App.jsx                  # Router with role-based redirects
├── main.jsx                 # Entry point
└── index.css                # Global styles
```

---

## 🚀 Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in your Firebase project values and backend URL in `.env`.

### 3. Run dev server
```bash
npm run dev
```
App runs on `http://localhost:3000`

---

## 🔐 Auth Flow

1. User logs in with Firebase email/password
2. Firebase ID token is attached to every API request via Axios interceptor
3. Backend verifies token → fetches role from MySQL
4. Frontend probes role by testing endpoints → stores role in localStorage
5. User is routed to their dashboard based on role

**Recommended improvement:** Add a `GET /me` endpoint to your backend that returns `{ role }` — this replaces the endpoint-probing workaround in `LoginPage.jsx`.

---

## 🎯 Role → Dashboard Mapping

| Role         | Dashboard           | Can Access                              |
|--------------|---------------------|-----------------------------------------|
| `admin`      | `/admin`            | All pages                               |
| `manager`    | `/manager`          | Manager, Sales, Products, Stores        |
| `salesperson`| `/sales`            | Sales entry, Products                   |

---

## ⚠️ Backend Bug Fixes Needed (for next step)

Found during frontend integration:

1. **`server.js`** — `router.use(verifyFirebaseToken)` should be `app.use(verifyFirebaseToken)`, and the import path uses `../middleware` instead of `./middleware`.
2. **`server.js`** — Health check route is commented out — uncomment it.
3. **`analytics.routes.js`** — Imports `getTotalRevenue` but controller exports `getSummary`. Rename to match.
4. **`stores.routes.js`** — Imports `createStores` (plural) but controller exports `createStore` (singular).
5. **`users_routes.js`** — Validates `region` field but `users.controller.js` doesn't use `region` in the INSERT query.

---

## 📦 Build for Production
```bash
npm run build
```
Output is in `dist/` — deploy to Firebase Hosting, Vercel, or Cloud Run.
