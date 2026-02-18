// src/pages/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { getSummary, getByRegion, getTopProducts } from "../services/api";
import KpiCard from "../components/KpiCard";
import Topbar from "../components/Topbar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#0d6efd", "#198754", "#ffc107", "#dc3545", "#6f42c1"];

const fmt = (n) =>
  Number(n) >= 1000 ? `₹${(Number(n) / 1000).toFixed(1)}k` : `₹${Number(n).toFixed(0)}`;

export default function AdminDashboard() {
  const [summary, setSummary]         = useState(null);
  const [regions, setRegions]         = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r, t] = await Promise.all([getSummary(), getByRegion(), getTopProducts()]);
        setSummary(s.data.data);
        setRegions(r.data.data);
        setTopProducts(t.data.data);
      } catch (err) {
        setError("Failed to load analytics. Check your connection.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="spinner-overlay"><div className="spinner-border text-primary" /></div>
  );

  if (error) return (
    <div className="alert alert-danger"><i className="bi bi-exclamation-triangle me-2" />{error}</div>
  );

  return (
    <>
      <Topbar title="Admin Dashboard">
        <span className="badge bg-danger-subtle text-danger fw-semibold px-3 py-2">
          <i className="bi bi-shield-fill me-1" />Admin
        </span>
      </Topbar>

      {/* KPI Row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-4">
          <KpiCard
            title="Total Revenue"
            value={fmt(summary?.totalRevenue ?? 0)}
            icon="bi-currency-rupee"
            color="primary"
          />
        </div>
        <div className="col-sm-6 col-xl-4">
          <KpiCard
            title="Total Sales"
            value={Number(summary?.totalSales ?? 0).toLocaleString()}
            icon="bi-receipt"
            color="success"
          />
        </div>
        <div className="col-sm-6 col-xl-4">
          <KpiCard
            title="Units Sold"
            value={Number(summary?.totalQuantity ?? 0).toLocaleString()}
            icon="bi-box-seam"
            color="warning"
          />
        </div>
      </div>

      {/* Charts row */}
      <div className="row g-3 mb-4">
        {/* Revenue by Region */}
        <div className="col-xl-7">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "0.75rem" }}>
            <div className="card-body">
              <h6 className="fw-bold mb-3" style={{ color: "#0f172a" }}>Revenue by Region</h6>
              {regions.length === 0 ? (
                <p className="text-muted text-center py-4">No region data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={regions} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="region" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, "Revenue"]} />
                    <Bar dataKey="revenue" fill="#0d6efd" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Top Products Pie */}
        <div className="col-xl-5">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "0.75rem" }}>
            <div className="card-body">
              <h6 className="fw-bold mb-3" style={{ color: "#0f172a" }}>Top 5 Products</h6>
              {topProducts.length === 0 ? (
                <p className="text-muted text-center py-4">No product data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={topProducts} dataKey="totalSold" nameKey="product_name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name.slice(0,10)} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(v) => [v, "Units Sold"]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: "0.75rem" }}>
        <div className="card-body">
          <h6 className="fw-bold mb-3" style={{ color: "#0f172a" }}>Top Products Breakdown</h6>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Product Name</th>
                  <th>Units Sold</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => {
                  const total = topProducts.reduce((a, x) => a + Number(x.totalSold), 0);
                  const pct = total ? ((Number(p.totalSold) / total) * 100).toFixed(1) : 0;
                  return (
                    <tr key={i}>
                      <td><span className="badge bg-primary rounded-pill">{i + 1}</span></td>
                      <td className="fw-semibold">{p.product_name}</td>
                      <td>{Number(p.totalSold).toLocaleString()}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: 6 }}>
                            <div className="progress-bar" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                          </div>
                          <small className="text-muted">{pct}%</small>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
