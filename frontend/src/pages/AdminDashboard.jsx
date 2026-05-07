import { useEffect, useState } from "react";
import {
  getSummary,
  getByRegion,
  getTopProducts,
  getStores,
  getStoreSales,
  getStorePerformance,
  getTest,
} from "../services/api";
import KpiCard from "../components/KpiCard";
import Topbar from "../components/Topbar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { toast } from "react-toastify";
import Skeleton from "react-loading-skeleton";

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
];

const fmt = (n) =>
  Number(n) >= 100000
    ? `₹${(Number(n) / 100000).toFixed(1)}L`
    : Number(n) >= 1000
      ? `₹${(Number(n) / 1000).toFixed(1)}k`
      : `₹${Number(n).toFixed(0)}`;

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [regions, setRegions] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activetime, setActivetime] = useState("All");
  const [activeRegion, setActiveRegion] = useState("All");

  const getStartDate = (filter) => {
    const now = new Date();

    let date = null;

    switch (filter) {
      case "1 Year":
        date = new Date(now.setFullYear(now.getFullYear() - 1));
        break;

      case "3 Month":
        date = new Date(now.setMonth(now.getMonth() - 3));
        break;

      case "1 Week":
        date = new Date(now.setDate(now.getDate() - 7));
        break;

      case "Today":
        date = new Date(now.setHours(0, 0, 0, 0));
        break;

      case "All":
      default:
        return null;
    }
    return date.toISOString();
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        console.log(activetime);
        const startDate = getStartDate(activetime);
        console.log(startDate);
        const results = await Promise.allSettled([
          getSummary(startDate),
          getByRegion(startDate),
          getTopProducts(startDate),
          getTest(),
          getStorePerformance(startDate),
        ]);

        const [s, r, t, st] = results;

        setSummary(s.status === "fulfilled" ? s.value?.data?.data || [] : []);
        setRegions(r.status === "fulfilled" ? r.value?.data?.data || [] : []);
        setTopProducts(
          t.status === "fulfilled" ? t.value?.data?.data || [] : [],
        );
        setStores(st.status === "fulfilled" ? st.value?.data?.data || [] : []);
      } catch (err) {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    })();
  }, [activetime]);

  const time = ["All", "1 Year", "3 Month", "1 Week", "Today"];

  const regionNames = ["All", ...new Set(stores.map((s) => s.region))];
  const filteredStores =
    activeRegion === "All"
      ? stores
      : stores.filter((s) => s.region === activeRegion);

  const totalUnits = topProducts.reduce((a, x) => a + Number(x.totalSold), 0);

  return (
    <>
      <Topbar title="Admin Dashboard">
        <span className="badge bg-danger-subtle text-danger fw-semibold px-3 py-2">
          <i className="bi bi-shield-fill me-1" />
          Admin
        </span>
      </Topbar>
      {loading ? (
        <div className="d-flex gap-2 flex-wrap m-4">
          {Array(6)
            .fill()
            .map((_, i) => (
              <Skeleton
                key={i}
                height={30}
                width={70}
                style={{ borderRadius: 20 }}
              />
            ))}
        </div>
      ) : (
        <div className="d-flex gap-2 flex-wrap m-4">
          {time.map((r) => (
            <button
              key={r}
              className={`btn btn-sm ${
                activetime === r ? "btn-primary" : "btn-outline-secondary"
              }`}
              style={{ fontSize: 12, borderRadius: "20px" }}
              onClick={() => setActivetime(r)}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* KPI Row */}
      <div className="row g-3 mb-4">
        {[
          {
            title: "Total Revenue",
            value: fmt(summary?.totalRevenue ?? 0),
            icon: "bi-currency-rupee",
            color: "primary",
            sub: "All regions ",
          },
          {
            title: "Total Transactions",
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
            sub: "Across all stores",
          },
          {
            title: "Active Stores",
            value: stores.length,
            icon: "bi-shop",
            color: "info",
            sub: `${regions.length} regions`,
          },
        ].map((kpi, i) => (
          <div className="col-sm-6 col-xl-3" key={i}>
            <div className="card p-3">
              {loading ? (
                <div className="row g-3 mb-4">
                  {Array(4)
                    .fill()
                    .map((_, i) => (
                      <div className="col-sm-6 col-xl-3" key={i}>
                        <div className="card p-3">
                          <Skeleton height={12} width="40%" />
                          <div className="mt-2">
                            <Skeleton height={28} width="70%" />
                          </div>
                          <div className="mt-2">
                            <Skeleton height={10} width="50%" />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <KpiCard
                  title={kpi.title}
                  value={kpi.value}
                  icon={kpi.icon}
                  color={kpi.color}
                  sub={kpi.sub}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="row g-3 mb-4">
        {/* Revenue by Region bar */}
        <div className="col-xl-12">
          <div
            className="card border-0 shadow-sm h-100"
            style={{ borderRadius: "0.75rem" }}
          >
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0" style={{ color: "#0f172a" }}>
                  Revenue by Region
                </h6>
                <span className="badge bg-primary-subtle text-primary">
                  {regions.length} regions
                </span>
              </div>
              {loading ? (
                <Skeleton height={260} style={{ borderRadius: "0.75rem" }} />
              ) : regions.length === 0 ? (
                <p className="text-muted text-center py-5">No region data</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={regions}
                    margin={{ left: 10, right: 10, top: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="region" tick={{ fontSize: 11 }} />
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
                    <Bar dataKey="revenue" fill="#800080" radius={[6, 6, 0, 0]}>
                      {regions.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Top Products Pie */}
        {/* <div className="col-xl-4">
          <div
            className="card border-0 shadow-sm h-100"
            style={{ borderRadius: "0.75rem" }}
          >
            <div className="card-body">
              <h6 className="fw-bold mb-3" style={{ color: "#0f172a" }}>
                Units Sold — Top Products
              </h6>
              {topProducts.length === 0 ? (
                <p className="text-muted text-center py-5">No product data</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={topProducts.slice(0, 5)}
                      dataKey="totalSold"
                      nameKey="product_name"
                      cx="50%"
                      cy="45%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={3}
                    >
                      {topProducts.slice(0, 5).map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [v, "Units"]} />
                    <Legend
                      formatter={(v) =>
                        v?.length > 14 ? v.slice(0, 14) + "…" : v
                      }
                      iconType="circle"
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div> */}
      </div>

      {/* Store Performance Table */}
      <div
        className="card border-0 shadow-sm mb-4"
        style={{ borderRadius: "0.75rem" }}
      >
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
            <h6 className="fw-bold mb-0" style={{ color: "#0f172a" }}>
              Store Performance
            </h6>
            <div className="d-flex gap-2 flex-wrap">
              {regionNames.map((r) => (
                <button
                  key={r}
                  className={`btn btn-sm ${
                    activeRegion === r ? "btn-primary" : "btn-outline-secondary"
                  }`}
                  style={{ fontSize: 12, borderRadius: "20px" }}
                  onClick={() => setActiveRegion(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ fontSize: 12 }}>#</th>
                  <th style={{ fontSize: 12 }}>Store</th>
                  <th style={{ fontSize: 12 }}>City</th>
                  <th style={{ fontSize: 12 }}>Region</th>
                  <th style={{ fontSize: 12 }}>Revenue</th>
                  <th style={{ fontSize: 12 }}>Orders</th>
                  <th style={{ fontSize: 12 }}>Avg Order</th>
                  <th style={{ fontSize: 12 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(6)
                    .fill()
                    .map((_, i) => (
                      <tr key={i}>
                        <td>
                          <Skeleton width={30} />
                        </td>
                        <td>
                          <Skeleton width={120} />
                        </td>
                        <td>
                          <Skeleton width={100} />
                        </td>
                        <td>
                          <Skeleton width={80} />
                        </td>
                        <td>
                          <Skeleton width={90} />
                        </td>
                        <td>
                          <Skeleton width={60} />
                        </td>
                        <td>
                          <Skeleton width={80} />
                        </td>
                        <td>
                          <Skeleton width={70} />
                        </td>
                      </tr>
                    ))
                ) : filteredStores.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      No stores found
                    </td>
                  </tr>
                ) : (
                  filteredStores.map((s, i) => {
                    const avg =
                      s.totalOrders > 0 ? s.totalRevenue / s.totalOrders : 0;
                    return (
                      <tr key={s.store_id}>
                        <td>
                          <span className="badge bg-light text-dark">
                            {i + 1}
                          </span>
                        </td>
                        <td className="fw-semibold" style={{ fontSize: 13 }}>
                          {s.store_name}
                        </td>
                        <td style={{ fontSize: 13, color: "#64748b" }}>
                          {s.city}
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              fontSize: 11,
                            }}
                          >
                            {s.region}
                          </span>
                        </td>
                        <td className="fw-semibold" style={{ fontSize: 13 }}>
                          {fmt(s.totalRevenue ?? 0)}
                        </td>
                        <td style={{ fontSize: 13 }}>
                          {Number(s.totalOrders ?? 0).toLocaleString()}
                        </td>
                        <td style={{ fontSize: 13, color: "#64748b" }}>
                          {fmt(avg)}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              (s.totalRevenue ?? 0) > 500000
                                ? "bg-success-subtle text-success"
                                : (s.totalRevenue ?? 0) > 200000
                                  ? "bg-warning-subtle text-warning"
                                  : "bg-danger-subtle text-danger"
                            }`}
                          >
                            {(s.totalRevenue ?? 0) > 500000
                              ? "High"
                              : (s.totalRevenue ?? 0) > 200000
                                ? "Medium"
                                : "Low"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Products Detail Table */}
      <div
        className="card border-0 shadow-sm"
        style={{ borderRadius: "0.75rem" }}
      >
        <div className="card-body">
          <h6 className="fw-bold mb-3" style={{ color: "#0f172a" }}>
            Top Products Breakdown
          </h6>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ fontSize: 12 }}>#</th>
                  <th style={{ fontSize: 12 }}>Product</th>
                  <th style={{ fontSize: 12 }}>Category</th>
                  <th style={{ fontSize: 12 }}>Units Sold</th>
                  <th style={{ fontSize: 12 }}>Revenue</th>
                  <th style={{ fontSize: 12 }}>Share</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array(5)
                      .fill()
                      .map((_, i) => (
                        <tr key={i}>
                          <td>
                            <Skeleton width={30} />
                          </td>
                          <td>
                            <Skeleton width={120} />
                          </td>
                          <td>
                            <Skeleton width={80} />
                          </td>
                          <td>
                            <Skeleton width={70} />
                          </td>
                          <td>
                            <Skeleton width={90} />
                          </td>
                          <td>
                            <Skeleton height={6} width="100%" />
                          </td>
                        </tr>
                      ))
                  : topProducts.map((p, i) => {
                      const pct = totalUnits
                        ? ((Number(p.totalSold) / totalUnits) * 100).toFixed(1)
                        : 0;
                      return (
                        <tr key={i}>
                          <td>
                            <span className="badge bg-primary rounded-pill">
                              {i + 1}
                            </span>
                          </td>
                          <td className="fw-semibold" style={{ fontSize: 13 }}>
                            {p.product_name}
                          </td>
                          <td>
                            <span
                              className="badge bg-secondary-subtle text-secondary"
                              style={{ fontSize: 11 }}
                            >
                              {p.category}
                            </span>
                          </td>
                          <td style={{ fontSize: 13 }}>
                            {Number(p.totalSold).toLocaleString()}
                          </td>
                          <td className="fw-semibold" style={{ fontSize: 13 }}>
                            {fmt(p.totalRevenue ?? 0)}
                          </td>
                          <td style={{ minWidth: 160 }}>
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
                              <small
                                className="text-muted"
                                style={{ fontSize: 11 }}
                              >
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
        </div>
      </div>
    </>
  );
}
