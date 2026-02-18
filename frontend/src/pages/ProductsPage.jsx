// src/pages/ProductsPage.jsx
import { useEffect, useState } from "react";
import { getProducts, createProduct } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Topbar from "../components/Topbar";

export default function ProductsPage() {
  const { role } = useAuth();
  const [products, setProducts]       = useState([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [form, setForm]               = useState({ product_name: "", category: "", unit_price: "" });
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const LIMIT = 10;

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await getProducts(p, LIMIT);
      setProducts(res.data.data);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");
    try {
      await createProduct({ ...form, unit_price: Number(form.unit_price) });
      setFormSuccess(`"${form.product_name}" added successfully.`);
      setForm({ product_name: "", category: "", unit_price: "" });
      load(1);
    } catch (err) {
      setFormError(err.response?.data?.message ?? "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const canCreate = ["admin", "manager"].includes(role);

  return (
    <>
      <Topbar title="Products">
        {canCreate && (
          <button className="btn btn-primary btn-sm fw-semibold" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-lg me-1" />Add Product
          </button>
        )}
      </Topbar>

      <div className="card border-0 shadow-sm" style={{ borderRadius: "0.75rem" }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="spinner-overlay"><div className="spinner-border text-primary" /></div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ paddingLeft: 20 }}>Product</th>
                    <th>Category</th>
                    <th>Unit Price</th>
                    <th>Added</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 && (
                    <tr><td colSpan={4} className="text-center text-muted py-4">No products yet</td></tr>
                  )}
                  {products.map((p) => (
                    <tr key={p.product_id}>
                      <td style={{ paddingLeft: 20 }}>
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-2 d-flex align-items-center justify-content-center"
                               style={{ width: 36, height: 36, background: "#eff6ff", flexShrink: 0 }}>
                            <i className="bi bi-box-seam text-primary" />
                          </div>
                          <span className="fw-semibold">{p.product_name}</span>
                        </div>
                      </td>
                      <td>
                        {p.category
                          ? <span className="badge bg-secondary-subtle text-secondary">{p.category}</span>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td className="fw-bold text-success">₹{Number(p.unit_price).toLocaleString()}</td>
                      <td className="text-muted" style={{ fontSize: 13 }}>
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <small className="text-muted">Showing {products.length} of {total} products</small>
              <div className="d-flex gap-1">
                <button className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <i className="bi bi-chevron-left" />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} className={`btn btn-sm ${page === i + 1 ? "btn-primary" : "btn-outline-secondary"}`}
                          onClick={() => setPage(i + 1)}>
                    {i + 1}
                  </button>
                ))}
                <button className="btn btn-sm btn-outline-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  <i className="bi bi-chevron-right" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "0.75rem", border: "none" }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Add New Product</h5>
                <button className="btn-close" onClick={() => { setShowModal(false); setFormError(""); setFormSuccess(""); }} />
              </div>
              <div className="modal-body">
                {formError   && <div className="alert alert-danger py-2">{formError}</div>}
                {formSuccess && <div className="alert alert-success py-2">{formSuccess}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Product Name</label>
                    <input className="form-control" placeholder="e.g. Wireless Mouse" value={form.product_name}
                           onChange={(e) => setForm({ ...form, product_name: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Category</label>
                    <input className="form-control" placeholder="e.g. Electronics" value={form.category}
                           onChange={(e) => setForm({ ...form, category: e.target.value })} />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Unit Price (₹)</label>
                    <input type="number" className="form-control" placeholder="0.00" min="0.01" step="0.01"
                           value={form.unit_price}
                           onChange={(e) => setForm({ ...form, unit_price: e.target.value })} required />
                  </div>
                  <button type="submit" className="btn btn-primary w-100 fw-semibold" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Adding…</> : "Add Product"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
