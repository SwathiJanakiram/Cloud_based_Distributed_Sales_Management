// src/pages/ManagerDashboard.jsx
import { useEffect, useState } from "react";
import { getSummary, getByRegion, getTopProducts } from "../services/api";
import KpiCard from "../components/KpiCard";
import Topbar from "../components/Topbar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const fmt = (n) =>
  Number(n) >= 1000 ? `₹${(Number(n) / 1000).toFixed(1)}k` : `₹${Number(n).toFixed(0)}`;

export default function ManagerDashboard() {
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
      } catch {
        setError("Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="spinner-overlay"><div className="spinner-border text-primary" /></div>;
  if (error)   return <div className="alert alert-danger">{error}</div>;

  return (
    <>
      <Topbar title="Manager Dashboard">
        <span className="badge bg-warning-subtle text-warning fw-semibold px-3 py-2">
          <i className="bi bi-person-badge me-1" />Manager
        </span>
      </Topbar>

      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-4">
          <KpiCard title="Total Revenue" value={fmt(summary?.totalRevenue ?? 0)} icon="bi-currency-rupee" color="primary" />
        </div>
        <div className="col-sm-6 col-xl-4">
          <KpiCard title="Total Transactions" value={Number(summary?.totalSales ?? 0).toLocaleString()} icon="bi-receipt" color="success" />
        </div>
        <div className="col-sm-6 col-xl-4">
          <KpiCard title="Units Sold" value={Number(summary?.totalQuantity ?? 0).toLocaleString()} icon="bi-box-seam" color="warning" />
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm" style={{ borderRadius: "0.75rem" }}>
            <div className="card-body">
              <h6 className="fw-bold mb-3">Revenue by Region</h6>
              {regions.length === 0 ? (
                <p className="text-muted text-center py-4">No region data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={regions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="region" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, "Revenue"]} />
                    <Bar dataKey="revenue" fill="#198754" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "0.75rem" }}>
            <div className="card-body">
              <h6 className="fw-bold mb-3">Top Products</h6>
              {topProducts.length === 0 ? (
                <p className="text-muted text-center py-4">No data</p>
              ) : (
                <ul className="list-unstyled mb-0">
                  {topProducts.map((p, i) => (
                    <li key={i} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge rounded-pill" style={{ background: "#eff6ff", color: "#1d4ed8", fontWeight: 700, minWidth: 24 }}>{i + 1}</span>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{p.product_name}</span>
                      </div>
                      <span className="badge bg-success-subtle text-success">{Number(p.totalSold).toLocaleString()} units</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
