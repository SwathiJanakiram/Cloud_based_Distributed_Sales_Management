// src/components/DashboardLayout.jsx
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = {
  admin: [
    { to: "/admin",    icon: "bi-speedometer2", label: "Dashboard" },
    { to: "/sales",    icon: "bi-receipt",       label: "New Sale" },
    { to: "/products", icon: "bi-box-seam",      label: "Products" },
    { to: "/stores",   icon: "bi-shop",          label: "Stores" },
    { to: "/users",    icon: "bi-people",         label: "Users" },
  ],
  manager: [
    { to: "/manager",  icon: "bi-graph-up-arrow", label: "Dashboard" },
    { to: "/sales",    icon: "bi-receipt",        label: "New Sale" },
    { to: "/products", icon: "bi-box-seam",       label: "Products" },
    { to: "/stores",   icon: "bi-shop",           label: "Stores" },
  ],
  salesperson: [
    { to: "/sales",    icon: "bi-receipt",   label: "New Sale" },
    { to: "/products", icon: "bi-box-seam",  label: "Products" },
  ],
};

export default function DashboardLayout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = NAV_ITEMS[role] ?? NAV_ITEMS.salesperson;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div>
      {/* ── Sidebar ── */}
      <nav className="sidebar">
        <div className="brand">
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-2 bg-primary d-flex align-items-center justify-content-center"
                 style={{ width: 32, height: 32 }}>
              <i className="bi bi-lightning-charge-fill text-white" style={{ fontSize: 16 }} />
            </div>
            <span className="text-white fw-bold fs-6">SalesCloud</span>
          </div>
        </div>

        <nav className="flex-grow-1 py-2">
          {navItems.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <i className={`bi ${icon}`} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: "1rem 0.75rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="d-flex align-items-center gap-2 mb-3 px-2">
            <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold"
                 style={{ width: 32, height: 32, fontSize: 13, flexShrink: 0 }}>
              {user?.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div className="text-white" style={{ fontSize: 12, fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {user?.email}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "capitalize" }}>{role}</div>
            </div>
          </div>
          <button className="btn btn-sm btn-outline-secondary w-100" onClick={handleLogout}
                  style={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.15)", fontSize: 12 }}>
            <i className="bi bi-box-arrow-right me-1" /> Sign Out
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
