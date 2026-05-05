import { useEffect, useState } from "react";
import { createSale, getProducts, getStores, getMySales } from "../services/api";
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
  const [products, setProducts]     = useState([]);
  const [stores, setStores]         = useState([]);
  const [mySales, setMySales]       = useState([]);
  const [form, setForm]             = useState({ product_id: "", store_id: "", quantity: 1 });
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab]   = useState("new");

  const load = async () => {
    try {
      const [p, s, my] = await Promise.all([
        getProducts(1, 100),
        getStores(),
        getMySales(user?.user_id),
      ]);
      setProducts(p.data.data);
      setStores(s.data.data);
      setMySales(my.data.data ?? []);
    } catch {
      setError("Failed to load data.");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setResult(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const resp = await createSale({
        product_id: Number(form.product_id),
        store_id:   Number(form.store_id),
        user_id:    user?.user_id,
        quantity:   Number(form.quantity),
      });
      setResult(resp.data.data);
      setForm({ product_id: "", store_id: "", quantity: 1 });
      load();
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to record sale.");
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(
    (p) => String(p.product_id) === String(form.product_id)
  );
  const estTotal = selectedProduct
    ? selectedProduct.unit_price * Number(form.quantity)
    : null;

  const myStats = {
    total:     mySales.filter((s) => s.status === "completed").length,
    revenue:   mySales.filter((s) => s.status === "completed").reduce((a, s) => a + Number(s.total_amount), 0),
    returned:  mySales.filter((s) => s.status === "returned").length,
    cancelled: mySales.filter((s) => s.status === "cancelled").length,
  };

  if (pageLoading)
    return (
      <div className="spinner-overlay">
        <div className="spinner-border text-primary" />
      </div>
    );

  return (
    <>
      <Topbar title="Sales Dashboard">
        <span className="badge bg-success-subtle text-success fw-semibold px-3 py-2">
          <i className="bi bi-receipt me-1" />Salesperson
        </span>
      </Topbar>

      {/* My Stats Row */}
      <div className="row g-3 mb-4">
        {[
          {
            label: "My Completed Sales",
            value: myStats.total,
            icon: "bi-check2-circle",
            bg: "#eff6ff",
            color: "#1d4ed8",
          },
          {
            label: "My Revenue",
            value: fmt(myStats.revenue),
            icon: "bi-currency-rupee",
            bg: "#f0fdf4",
            color: "#166534",
          },
          {
            label: "Returns",
            value: myStats.returned,
            icon: "bi-arrow-return-left",
            bg: "#fef2f2",
            color: "#991b1b",
          },
          {
            label: "Cancelled",
            value: myStats.cancelled,
            icon: "bi-x-circle",
            bg: "#fefce8",
            color: "#854d0e",
          },
        ].map((s, i) => (
          <div className="col-sm-6 col-xl-3" key={i}>
            <div
              className="card border-0 h-100"
              style={{ borderRadius: "0.75rem", background: s.bg }}
            >
              <div className="card-body d-flex align-items-center gap-3">
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <i className={`${s.icon} fs-5`} style={{ color: s.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>
                    {s.value}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills mb-4 gap-2">
        {[
          { id: "new", label: "New Sale", icon: "bi-cart-plus" },
          { id: "history", label: "My History", icon: "bi-clock-history" },
        ].map((t) => (
          <li className="nav-item" key={t.id}>
            <button
              className={`nav-link ${activeTab === t.id ? "active" : ""}`}
              style={{
                borderRadius: "20px",
                fontSize: 13,
                padding: "6px 18px",
              }}
              onClick={() => setActiveTab(t.id)}
            >
              <i className={`${t.icon} me-2`} />
              {t.label}
            </button>
          </li>
        ))}
      </ul>

      {/* New Sale Form */}
      {activeTab === "new" && (
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div
              className="card border-0 shadow-sm"
              style={{ borderRadius: "0.75rem" }}
            >
              <div className="card-body p-4">
                <h6 className="fw-bold mb-4" style={{ color: "#0f172a" }}>
                  <i className="bi bi-cart-plus me-2 text-primary" />
                  Record a Sale Transaction
                </h6>

                {result && (
                  <div className="alert alert-success d-flex align-items-center gap-3 mb-4">
                    <i className="bi bi-check-circle-fill fs-4" />
                    <div>
                      <div className="fw-bold">Sale Recorded!</div>
                      <div style={{ fontSize: 13 }}>
                        Total:{" "}
                        <strong>
                          ₹{Number(result.total_amount).toLocaleString()}
                        </strong>{" "}
                        · Sale #{result.sale_id}
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
                    <i className="bi bi-exclamation-circle-fill" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                      Product
                    </label>
                    <select
                      name="product_id"
                      className="form-select"
                      value={form.product_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">— Select a product —</option>
                      {products.map((p) => (
                        <option key={p.product_id} value={p.product_id}>
                          {p.product_name} — ₹{Number(p.unit_price).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                      Store
                    </label>
                    <select
                      name="store_id"
                      className="form-select"
                      value={form.store_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">— Select a store —</option>
                      {stores.map((s) => (
                        <option key={s.store_id} value={s.store_id}>
                          {s.store_name} — {s.city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold" style={{ fontSize: 13 }}>
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      className="form-control"
                      min={1}
                      value={form.quantity}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {estTotal !== null && (
                    <div
                      className="rounded-3 p-3 mb-4"
                      style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span style={{ fontSize: 13, color: "#1d4ed8", fontWeight: 600 }}>
                          Estimated Total
                        </span>
                        <span style={{ fontSize: 20, fontWeight: 700, color: "#1d4ed8" }}>
                          ₹{Number(estTotal).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: "#3b82f6", marginTop: 2 }}>
                        {Number(form.quantity)} × ₹
                        {Number(selectedProduct?.unit_price).toLocaleString()} ={" "}
                        ₹{Number(estTotal).toLocaleString()}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Processing…
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2-circle me-2" />
                        Confirm Sale
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Sales History */}
      {activeTab === "history" && (
        <div className="card border-0 shadow-sm" style={{ borderRadius: "0.75rem" }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0" style={{ color: "#0f172a" }}>
                My Sales History
              </h6>
              <span className="text-muted" style={{ fontSize: 12 }}>
                {mySales.length} transactions
              </span>
            </div>

            {mySales.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-receipt text-muted fs-2 d-block mb-2" />
                <span className="text-muted">No sales recorded yet</span>
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
                      <th style={{ fontSize: 12 }}>Date</th>
                      <th style={{ fontSize: 12 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mySales.map((s, i) => {
                      const st = STATUS_STYLE[s.status] ?? STATUS_STYLE.cancelled;
                      return (
                        <tr key={i}>
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
                          <td style={{ fontSize: 12, color: "#64748b" }}>
                            {new Date(s.sold_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
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
      )}
    </>
  );
}