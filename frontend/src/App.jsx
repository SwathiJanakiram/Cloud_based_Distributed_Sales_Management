// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-loading-skeleton/dist/skeleton.css";

import LoginPage        from "./pages/LoginPage";
import AdminDashboard   from "./pages/AdminDashboard";
import StoreManagerDashboard from "./pages/StoreManagerDashboard";
import RegionalManagerDashboard from "./pages/RegionalManagerDashboard";
import SalesDashboard   from "./pages/SalesDashboard";
import UsersPage        from "./pages/UsersPage";
import ProductsPage     from "./pages/ProductsPage";
import StoresPage       from "./pages/StoresPage";
import WarehousePage        from "./pages/WarehousePage";
import InventoryPage from "./pages/InventoryPage";
import NewSalePage from "./pages/NewSalePage";
import AuditLogs from "./pages/AuditPage";
import NotFoundPage     from "./pages/NotFoundPage";
import ProtectedRoute   from "./components/ProtectedRoute";
import DashboardLayout  from "./components/DashboardLayout";

export default function App() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="spinner-overlay">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  // Redirect logged-in users to their dashboard
  const roleDashboard = () => {
    if (role === "admin")      return "/admin";
    if (role === "store_manager")    return "/storemanager";
    if (role === "regional_manager")    return "/regionalmanager";
    if (role === "salesperson") return "/sales";
    return "/";
  };

  return (
    <>
    <ToastContainer
  position="top-right"
  autoClose={3000}
  hideProgressBar={false}
  newestOnTop
  closeOnClick
  pauseOnHover
  theme="light"
/>
    <Routes>
      {/* Public */}
      
      <Route
        path="/login"
        element={user ? <Navigate to={roleDashboard()} replace /> : <LoginPage />}
      />

      {/* Protected layouts */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Admin only */}
          <Route path="/admin"    element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/users"    element={<ProtectedRoute roles={["admin"]}><UsersPage /></ProtectedRoute>} />
         <Route path="/warehouses"    element={<ProtectedRoute roles={["admin"]}><WarehousePage /></ProtectedRoute>} />
          <Route path="/stores"   element={<ProtectedRoute roles={["admin","regional_manager"]}><StoresPage /></ProtectedRoute>} />

          {/* Manager */}
          <Route path="/regionalmanager"  element={<ProtectedRoute roles={["admin","regional_manager"]}><RegionalManagerDashboard /></ProtectedRoute>} />

          {/* Manager */}
          <Route path="/storemanager"  element={<ProtectedRoute roles={["admin","store_manager"]}><StoreManagerDashboard /></ProtectedRoute>} />

          <Route path="/salesperson"  element={<ProtectedRoute roles={["admin","regional_manager","store_manager","salesperson"]}><SalesDashboard /></ProtectedRoute>} />

          {/* Salesperson */}
          <Route path="/sales"    element={<ProtectedRoute roles={["admin","regional_manager","store_manager","salesperson"]}><NewSalePage /></ProtectedRoute>} />

          <Route path="/inventory" element={<ProtectedRoute roles={["admin","regional_manager","store_manager","salesperson"]}><InventoryPage /></ProtectedRoute>}/>

          {/* Products - all roles */}
          <Route path="/products" element={<ProductsPage />} />

          {/* Products - all roles */}
          <Route path="/audit" element={<ProtectedRoute roles={["admin"]}><AuditLogs /></ProtectedRoute>} />
        </Route>
      </Route>

      {/* Fallbacks */}
      <Route path="/"   element={<Navigate to={user ? roleDashboard() : "/login"} replace />} />
      <Route path="*"   element={<NotFoundPage />} />
    </Routes>
    </>
  );
}
