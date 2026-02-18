// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ roles, children }) {
  const { user, role } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(role)) {
    // Redirect to their own dashboard instead of 403
    const fallback = role === "admin" ? "/admin" : role === "manager" ? "/manager" : "/sales";
    return <Navigate to={fallback} replace />;
  }

  return children ?? <Outlet />;
}
