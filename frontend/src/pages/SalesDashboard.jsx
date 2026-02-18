// src/pages/SalesDashboard.jsx
import { useEffect, useState } from "react";
import { createSale, getProducts, getStores } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Topbar from "../components/Topbar";

export default function SalesDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [stores, setStores]     = useState([]);
  const [form, setForm]         = useState({ product_id: "", store_id: "", quantity: 1 });
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, s] = await Promise.all([getProducts(1, 100), getStores()]);
        setProducts(p.data.data);
        setStores(s.data.data);
      } catch {
        setError("Failed to load products or stores.");
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, []);

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
      // user_id comes from the authenticated user stored in the DB
      const resp = await createSale({
        product_id: Number(form.product_id),
        store_id:   Number(form.store_id),
        user_id:    Number(form.user_id ?? 1), // ideally from auth context
        quantity:   Number(form.quantity),
      });
      setResult(resp.data.data);
      setForm({ product_id: "", store_id: "", quantity: 1 });
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to record sale.");
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find((p) => String(p.product_id) === String(form.product_id));
  const estTotal = selectedProduct ? (selectedProduct.unit_price * Number(form.quantity)).toFixed(2) : null;

  if (pageLoading) return <div className="spinner-overlay"><div className="spinner-border text-primary" /></div>;

  return (
    <>
      <Topbar title="New Sale">
        <span className="badge bg-success-subtle text-success fw-semibold px-3 py-2">
          <i className="bi bi-receipt me-1" />Sales Entry
        </span>
      </Topbar>

      <div className="row justify-content-center">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm" style={{ borderRadius: "0.75rem" }}>
            <div className="card-body p-4">
              <h6 className="fw-bold mb-4" style={{ color: "#0f172a" }}>
                <i className="bi bi-cart-plus me-2 text-primary" />Record a Sale Transaction
              </h6>

              {result && (
                <div className="alert alert-success d-flex align-items-center gap-3">
                  <i className="bi bi-check-circle-fill fs-4" />
                  <div>
                    <div className="fw-bold">Sale Recorded Successfully!</div>
                    <div>Total Amount: <strong>₹{Number(result.total_amount).toLocaleString()}</strong></div>
                  </div>
                </div>
              )}

              {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-circle-fill" />{error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Product</label>
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
                        {p.product_name} — ₹{p.unit_price}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Store</label>
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
                        {s.store_name} — {s.city}, {s.region}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Quantity</label>
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

                {/* Live total estimate */}
                {estTotal && (
                  <div className="rounded-2 p-3 mb-4 d-flex justify-content-between align-items-center"
                       style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                    <span className="fw-semibold text-primary" style={{ fontSize: 14 }}>Estimated Total</span>
                    <span className="fw-bold text-primary fs-5">₹{Number(estTotal).toLocaleString()}</span>
                  </div>
                )}

                <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading}>
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2" />Processing…</>
                    : <><i className="bi bi-check2-circle me-2" />Confirm Sale</>
                  }
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
