// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function LoginPage() {
  const { login, setUserRole } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      // Fetch the user's role from backend after login
      // We call /users with pagination; if 403 → not admin, try /stores etc.
      // Simplest: call a lightweight endpoint that returns role.
      // Here we try to get from a custom claim or fall back to probing.
      // For now: call /analytics/summary — all roles can access.
      // The backend returns 401/403 if wrong role.
      // Best practice: add a GET /me endpoint to your backend.
      // We'll probe role by trying endpoints:
      let role = "salesperson";
      try {
        await api.get("/users?limit=1"); // only admin can do this
        role = "admin";
      } catch {
        try {
          await api.get("/stores"); // admin + manager
          role = "manager";
        } catch {
          role = "salesperson";
        }
      }
      setUserRole(role);
      const dest = role === "admin" ? "/admin" : role === "manager" ? "/manager" : "/sales";
      navigate(dest, { replace: true });
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Logo */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center rounded-3 bg-primary mb-3"
               style={{ width: 52, height: 52 }}>
            <i className="bi bi-lightning-charge-fill text-white fs-4" />
          </div>
          <h4 className="fw-bold mb-0" style={{ color: "#0f172a" }}>SalesCloud</h4>
          <p className="text-muted" style={{ fontSize: 14 }}>Sign in to your account</p>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2" style={{ fontSize: 14 }}>
            <i className="bi bi-exclamation-circle-fill" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Email address</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-envelope text-muted" /></span>
              <input
                type="email"
                className="form-control"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Password</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-lock text-muted" /></span>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading}>
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2" />Signing in…</>
              : <><i className="bi bi-arrow-right-circle me-2" />Sign In</>
            }
          </button>
        </form>

        <p className="text-center text-muted mt-4 mb-0" style={{ fontSize: 12 }}>
          Access is managed by your administrator
        </p>
      </div>
    </div>
  );
}
