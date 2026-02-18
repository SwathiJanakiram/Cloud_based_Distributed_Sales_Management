// src/pages/StoresPage.jsx
import { useEffect, useState } from "react";
import { getStores, createStore } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Topbar from "../components/Topbar";

export default function StoresPage() {
  const { role } = useAuth();
  const [stores, setStores]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [form, setForm]               = useState({ store_name: "", city: "", region: "" });
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await getStores();
      setStores(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");
    try {
      await createStore(form);
      setFormSuccess(`Store "${form.store_name}" created.`);
      setForm({ store_name: "", city: "", region: "" });
      load();
    } catch (err) {
      setFormError(err.response?.data?.message ?? "Failed to create store.");
    } finally {
      setSubmitting(false);
    }
  };

  const regionColors = { North: "primary", South: "success", East: "warning", West: "info" };

  return (
    <>
      <Topbar title="Stores">
        {role === "admin" && (
          <button className="btn btn-primary btn-sm fw-semibold" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus-lg me-1" />Add Store
          </button>
        )}
      </Topbar>

      {loading ? (
        <div className="spinner-overlay"><div className="spinner-border text-primary" /></div>
      ) : (
        <div className="row g-3">
          {stores.length === 0 && (
            <div className="col-12">
              <div className="card border-0 shadow-sm text-center py-5" style={{ borderRadius: "0.75rem" }}>
                <i className="bi bi-shop text-muted mb-2" style={{ fontSize: 40 }} />
                <p className="text-muted">No stores yet. Add your first store.</p>
              </div>
            </div>
          )}
          {stores.map((s) => {
            const color = regionColors[s.region] ?? "secondary";
            return (
              <div key={s.store_id} className="col-sm-6 col-xl-4">
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "0.75rem" }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="rounded-2 d-flex align-items-center justify-content-center"
                           style={{ width: 40, height: 40, background: "#eff6ff" }}>
                        <i className="bi bi-shop text-primary fs-5" />
                      </div>
                      <span className={`badge bg-${color}-subtle text-${color} px-2`}>{s.region}</span>
                    </div>
                    <h6 className="fw-bold mb-1 mt-2">{s.store_name}</h6>
                    <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                      <i className="bi bi-geo-alt me-1" />{s.city}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "0.75rem", border: "none" }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Add New Store</h5>
                <button className="btn-close" onClick={() => { setShowModal(false); setFormError(""); setFormSuccess(""); }} />
              </div>
              <div className="modal-body">
                {formError   && <div className="alert alert-danger py-2">{formError}</div>}
                {formSuccess && <div className="alert alert-success py-2">{formSuccess}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Store Name</label>
                    <input className="form-control" placeholder="e.g. Downtown Outlet" value={form.store_name}
                           onChange={(e) => setForm({ ...form, store_name: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: 13 }}>City</label>
                    <input className="form-control" placeholder="e.g. Mumbai" value={form.city}
                           onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Region</label>
                    <select className="form-select" value={form.region}
                            onChange={(e) => setForm({ ...form, region: e.target.value })} required>
                      <option value="">— Select region —</option>
                      {["North","South","East","West"].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary w-100 fw-semibold" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Creating…</> : "Create Store"}
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
