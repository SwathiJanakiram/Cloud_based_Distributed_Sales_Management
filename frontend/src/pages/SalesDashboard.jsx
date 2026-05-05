// src/pages/SalespersonDashboard.jsx
import { useEffect, useState } from "react";
import { getMySales } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Topbar from "../components/Topbar";

const fmt = (n) =>
  Number(n) >= 100000
    ? `₹${(Number(n) / 100000).toFixed(1)}L`
    : Number(n) >= 1000
    ? `₹${(Number(n) / 1000).toFixed(1)}k`
    : `₹${Number(n).toFixed(0)}`;

const STATUS_STYLE = {
  completed: { bg: "#dcfce7", color: "#166534" },
  returned:  { bg: "#fee2e2", color: "#991b1b" },
  cancelled: { bg: "#fef9c3", color: "#854d0e" },
};

export default function SalesDashboard() {
  const { user } = useAuth();
  const [sales, setSales]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await getMySales();
        setSales(res.data.data ?? []);
      } catch (err) {
        console.error(err);
        setError("Failed to load sales data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ✅ Only count completed sales in KPIs
  const completed  = sales.filter((s) => s.status === "completed");
  const returned   = sales.filter((s) => s.status === "returned");
  const cancelled  = sales.filter((s) => s.status === "cancelled");

  const totalRevenue = completed.reduce((sum, s) => sum + Number(s.total_amount), 0);
  const totalOrders  = completed.length;

  if (loading)
    return (
      <div className="spinner-overlay">
        <div className="spinner-border text-primary" />
      </div>
    );

  return (
    <>
      <Topbar title="My Dashboard">
        <span className="badge bg-success-subtle text-success fw-semibold px-3 py-2">
          <i className="bi bi-person-badge me-1" />Salesperson
        </span>
      </Topbar>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-circle-fill" />
          {error}
        </div>
      )}

      {/* ── KPI Row ─────────────────────────────────────────── */}
      <div className="row g-3 mb-4">
        {[
          {
            label: "My Revenue",
            value: fmt(totalRevenue),
            icon: "bi-currency-rupee",
            bg: "#eff6ff",
            color: "#1d4ed8",
          },
          {
            label: "Completed Sales",
            value: totalOrders,
            icon: "bi-check2-circle",
            bg: "#f0fdf4",
            color: "#166534",
          },
          {
            label: "Returns",
            value: returned.length,
            icon: "bi-arrow-return-left",
            bg: "#fef2f2",
            color: "#991b1b",
          },
          {
            label: "Cancelled",
            value: cancelled.length,
            icon: "bi-x-circle",
            bg: "#fefce8",
            color: "#854d0e",
          },
        ].map((k, i) => (
          <div className="col-sm-6 col-xl-3" key={i}>
            <div
              className="card border-0 h-100"
              style={{ borderRadius: "0.75rem", background: k.bg }}
            >
              <div className="card-body d-flex align-items-center gap-3">
                <div
                  style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "rgba(255,255,255,0.7)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <i className={`bi ${k.icon} fs-5`} style={{ color: k.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: k.color, fontWeight: 600 }}>
                    {k.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>
                    {k.value}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Sales History Table ──────────────────────────────── */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: "0.75rem" }}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0" style={{ color: "#0f172a" }}>
              My Sales History
            </h6>
            <span className="text-muted" style={{ fontSize: 12 }}>
              {sales.length} transactions
            </span>
          </div>

          {sales.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-receipt text-muted fs-2 d-block mb-2" />
              <span className="text-muted" style={{ fontSize: 14 }}>
                No sales recorded yet
              </span>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ fontSize: 12 }}>Sale #</th>
                    <th style={{ fontSize: 12 }}>Product</th>
                    <th style={{ fontSize: 12 }}>Store</th>
                    <th style={{ fontSize: 12 }}>Qty</th>
                    <th style={{ fontSize: 12 }}>Amount</th>
                    <th style={{ fontSize: 12 }}>Date</th>       {/* ✅ uses sold_at */}
                    <th style={{ fontSize: 12 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => {
                    const st = STATUS_STYLE[s.status] ?? STATUS_STYLE.cancelled;
                    return (
                      <tr key={s.sale_id}>
                        <td>
                          <span
                            className="badge bg-light text-dark"
                            style={{ fontSize: 11 }}
                          >
                            #{s.sale_id}
                          </span>
                        </td>

                        <td className="fw-semibold" style={{ fontSize: 13 }}>
                          {s.product_name}
                        </td>

                        <td style={{ fontSize: 13, color: "#64748b" }}>
                          {s.store_name}
                        </td>

                        <td style={{ fontSize: 13 }}>{s.quantity}</td>

                        <td className="fw-semibold" style={{ fontSize: 13 }}>
                          ₹{Number(s.total_amount).toLocaleString()}
                        </td>

                        {/* ✅ sold_at — not created_at */}
                        <td style={{ fontSize: 12, color: "#64748b" }}>
                          {s.sold_at
                            ? new Date(s.sold_at).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>

                        <td>
                          <span
                            className="badge"
                            style={{
                              background: st.bg,
                              color: st.color,
                              fontSize: 11,
                            }}
                          >
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}