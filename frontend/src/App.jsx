// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import LoginPage        from "./pages/LoginPage";
import AdminDashboard   from "./pages/AdminDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import SalesDashboard   from "./pages/SalesDashboard";
import UsersPage        from "./pages/UsersPage";
import ProductsPage     from "./pages/ProductsPage";
import StoresPage       from "./pages/StoresPage";
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
    if (role === "manager")    return "/manager";
    if (role === "salesperson") return "/sales";
    return "/";
  };

  return (
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
          <Route path="/stores"   element={<ProtectedRoute roles={["admin","manager"]}><StoresPage /></ProtectedRoute>} />

          {/* Manager */}
          <Route path="/manager"  element={<ProtectedRoute roles={["admin","manager"]}><ManagerDashboard /></ProtectedRoute>} />

          {/* Salesperson */}
          <Route path="/sales"    element={<ProtectedRoute roles={["admin","manager","salesperson"]}><SalesDashboard /></ProtectedRoute>} />

          {/* Products - all roles */}
          <Route path="/products" element={<ProductsPage />} />
        </Route>
      </Route>

      {/* Fallbacks */}
      <Route path="/"   element={<Navigate to={user ? roleDashboard() : "/login"} replace />} />
      <Route path="*"   element={<NotFoundPage />} />
    </Routes>
  );
}
