import { useEffect, useState } from "react";
import {
  getStoreSummary,
  getStoreSalespersonStats,
  getStoreTopProducts,
  getStoreLowStock,
  getStoreMonthlyTrend,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import KpiCard from "../components/KpiCard";
import Topbar from "../components/Topbar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell, 
} from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

const fmt = (n) =>
  Number(n) >= 100000
    ? `₹${(Number(n) / 100000).toFixed(1)}L`
    : Number(n) >= 1000
    ? `₹${(Number(n) / 1000).toFixed(1)}k`
    : `₹${Number(n).toFixed(0)}`; 

export default function StoreManagerDashboard() {
  const { user } = useAuth();
  const [summary, setSummary]         = useState(null);
  const [salespeople, setSalespeople] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock]       = useState([]);
  const [trend, setTrend]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  useEffect(() => {
    if (!user?.store_id) return;
    (async () => {
      try {
        const [s, sp, tp, ls, tr] = await Promise.all([
          getStoreSummary(user.store_id),
          getStoreSalespersonStats(user.store_id),
          getStoreTopProducts(user.store_id),
          getStoreLowStock(user.store_id),
          getStoreMonthlyTrend(user.store_id),
        ]);
        setSummary(s.data.data);
        setSalespeople(sp.data.data);
        setTopProducts(tp.data.data);
        setLowStock(ls.data.data);
        setTrend(tr.data.data);
      } catch {
        setError("Failed to load store data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading)
    return (
      <div className="spinner-overlay">
        <div className="spinner-border text-primary" />
      </div>
    );
  if (error)
    return (
      <div className="alert alert-danger m-4">
        <i className="bi bi-exclamation-triangle me-2" />
        {error}
      </div>
    );

  const maxSpRev = Math.max(
    ...salespeople.map((sp) => Number(sp.totalRevenue ?? 0)),
    1
  );

  return (
    <>
      <Topbar title="Store Manager Dashboard">
        <span className="badge bg-success-subtle text-success fw-semibold px-3 py-2">
          <i className="bi bi-shop me-1" />Store Manager
        </span>
      </Topbar>

      {/* Low Stock Alert Banner */}
      {lowStock.length > 0 && (
        <div
          className="alert d-flex align-items-center gap-2 mb-4"
          style={{
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: "0.75rem",
            color: "#9a3412",
          }}
        >
          <i className="bi bi-exclamation-triangle-fill fs-5" />
          <span style={{ fontSize: 13 }}>
            <strong>{lowStock.length} product{lowStock.length > 1 ? "s" : ""}</strong>{" "}
            are below low-stock threshold in your store. Scroll down to review.
          </span>
        </div>
      )}

      {/* KPI Row */}
      <div className="row g-3 mb-4">
        {[
          {
            title: "Store Revenue",
            value: fmt(summary?.totalRevenue ?? 0),
            icon: "bi-currency-rupee",
            color: "primary",
            sub: summary?.storeName ?? "Your Store",
          },
          {
            title: "Total Orders",
            value: Number(summary?.totalSales ?? 0).toLocaleString(),
            icon: "bi-receipt",
            color: "success",
            sub: `${summary?.completedSales ?? 0} completed`,
          },
          {
            title: "Units Sold",
            value: Number(summary?.totalQuantity ?? 0).toLocaleString(),
            icon: "bi-box-seam",
            color: "warning",
            sub: "This period",
          },
          {
            title: "Low Stock Items",
            value: lowStock.length,
            icon: "bi-exclamation-diamond",
            color: lowStock.length > 0 ? "danger" : "success",
            sub: lowStock.length > 0 ? "Need restocking" : "All stocked",
          },
        ].map((kpi, i) => (
          <div className="col-sm-6 col-xl-3" key={i}>
            <KpiCard
              title={kpi.title}
              value={kpi.value}
              icon={kpi.icon}
              color={kpi.color}
              sub={kpi.sub}
            />
          </div>
        ))}
      </div>

      {/* Trend + Products Row */}
      <div className="row g-3 mb-4">
        {/* Monthly Trend */}
        <div className="col-xl-8">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "0.75rem" }}>
            <div className="card-body">
              <h6 className="fw-bold mb-3" style={{ color: "#0f172a" }}>
                Monthly Revenue Trend — Store
              </h6>
              {trend.length === 0 ? (
                <p className="text-muted text-center py-5">No trend data</p>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart
                    data={trend}
                    margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis
                      tickFormatter={(v) =>
                        v >= 100000
                          ? `₹${(v / 100000).toFixed(0)}L`
                          : `₹${(v / 1000).toFixed(0)}k`
                      }
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(v) => [
                        `₹${Number(v).toLocaleString()}`,
                        "Revenue",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#16a34a"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: "#16a34a" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="col-xl-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "0.75rem" }}>
            <div className="card-body">
              <h6 className="fw-bold mb-3" style={{ color: "#0f172a" }}>
                Top Products
              </h6>
              {topProducts.length === 0 ? (
                <p className="text-muted text-center py-4">No data</p>
              ) : (
                <ul className="list-unstyled mb-0">
                  {topProducts.slice(0, 7).map((p, i) => (
                    <li
                      key={i}
                      className="d-flex align-items-center justify-content-between py-2"
                      style={{
                        borderBottom:
                          i < topProducts.slice(0, 7).length - 1
                            ? "1px solid #f1f5f9"
                            : "none",
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: COLORS[i % COLORS.length],
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {i + 1}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 500 }}>
                          {p.product_name.length > 18
                            ? p.product_name.slice(0, 18) + "…"
                            : p.product_name}
                        </span>
                      </div>
                      <span
                        className="badge bg-success-subtle text-success"
                        style={{ fontSize: 10 }}
                      >
                        {Number(p.totalSold).toLocaleString()} u
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Salesperson Performance */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "0.75rem" }}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0" style={{ color: "#0f172a" }}>
              Salesperson Performance
            </h6>
            <span className="text-muted" style={{ fontSize: 12 }}>
              {salespeople.length} assigned to your store
            </span>
          </div>

          {salespeople.length === 0 ? (
            <p className="text-muted text-center py-4">
              No salesperson data for this store
            </p>
          ) : (
            <>
              {/* Visual bar chart */}
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={salespeople}
                  margin={{ left: 10, right: 10, top: 5, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tickFormatter={(v) =>
                      v >= 100000
                        ? `₹${(v / 100000).toFixed(0)}L`
                        : `₹${(v / 1000).toFixed(0)}k`
                    }
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(v) => [`₹${Number(v).toLocaleString()}`, "Revenue"]}
                  />
                  <Bar dataKey="totalRevenue" radius={[6, 6, 0, 0]}>
                    {salespeople.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Detail table */}
              <div className="table-responsive mt-3">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ fontSize: 12 }}>Rank</th>
                      <th style={{ fontSize: 12 }}>Name</th>
                      <th style={{ fontSize: 12 }}>Transactions</th>
                      <th style={{ fontSize: 12 }}>Units Sold</th>
                      <th style={{ fontSize: 12 }}>Revenue</th>
                      <th style={{ fontSize: 12 }}>vs Best</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salespeople
                      .slice()
                      .sort((a, b) => Number(b.totalRevenue) - Number(a.totalRevenue))
                      .map((sp, i) => {
                        const pct = Math.round(
                          (Number(sp.totalRevenue ?? 0) / maxSpRev) * 100
                        );
                        return (
                          <tr key={sp.user_id}>
                            <td>
                              <span
                                className={`badge rounded-pill ${
                                  i === 0
                                    ? "bg-warning text-dark"
                                    : i === 1
                                    ? "bg-secondary text-white"
                                    : "bg-light text-dark"
                                }`}
                              >
                                #{i + 1}
                              </span>
                            </td>
                            <td>
                              <div className="fw-semibold" style={{ fontSize: 13 }}>
                                {sp.name}
                              </div>
                              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                                {sp.email}
                              </div>
                            </td>
                            <td style={{ fontSize: 13 }}>
                              {Number(sp.totalTransactions ?? 0).toLocaleString()}
                            </td>
                            <td style={{ fontSize: 13 }}>
                              {Number(sp.totalQuantity ?? 0).toLocaleString()}
                            </td>
                            <td className="fw-semibold" style={{ fontSize: 13 }}>
                              {fmt(sp.totalRevenue ?? 0)}
                            </td>
                            <td style={{ minWidth: 120 }}>
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="progress flex-grow-1"
                                  style={{ height: 6 }}
                                >
                                  <div
                                    className="progress-bar"
                                    style={{
                                      width: `${pct}%`,
                                      backgroundColor: COLORS[i % COLORS.length],
                                    }}
                                  />
                                </div>
                                <small style={{ fontSize: 10, color: "#94a3b8" }}>
                                  {pct}%
                                </small>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: "0.75rem" }}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0" style={{ color: "#0f172a" }}>
              Low Stock Alerts
            </h6>
            {lowStock.length > 0 && (
              <span className="badge bg-danger-subtle text-danger">
                {lowStock.length} items
              </span>
            )}
          </div>
          {lowStock.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-check-circle-fill text-success fs-3 d-block mb-2" />
              <span className="text-muted" style={{ fontSize: 13 }}>
                All products are sufficiently stocked
              </span>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ fontSize: 12 }}>Product</th>
                    <th style={{ fontSize: 12 }}>Category</th>
                    <th style={{ fontSize: 12 }}>Current Stock</th>
                    <th style={{ fontSize: 12 }}>Threshold</th>
                    <th style={{ fontSize: 12 }}>Deficit</th>
                    <th style={{ fontSize: 12 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((item, i) => {
                    const deficit = item.low_stock_threshold - item.current_stock;
                    const pct = Math.round(
                      (item.current_stock / item.low_stock_threshold) * 100
                    );
                    return (
                      <tr key={i}>
                        <td className="fw-semibold" style={{ fontSize: 13 }}>
                          {item.product_name}
                        </td>
                        <td>
                          <span
                            className="badge bg-secondary-subtle text-secondary"
                            style={{ fontSize: 11 }}
                          >
                            {item.category}
                          </span>
                        </td>
                        <td>
                          <span
                            className="fw-bold"
                            style={{
                              fontSize: 14,
                              color: pct <= 30 ? "#dc2626" : "#d97706",
                            }}
                          >
                            {item.current_stock}
                          </span>
                        </td>
                        <td style={{ fontSize: 13, color: "#64748b" }}>
                          {item.low_stock_threshold}
                        </td>
                        <td style={{ fontSize: 13, color: "#dc2626" }}>
                          -{deficit}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              pct <= 30
                                ? "bg-danger-subtle text-danger"
                                : "bg-warning-subtle text-warning"
                            }`}
                          >
                            {pct <= 30 ? "Critical" : "Low"}
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