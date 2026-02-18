// src/pages/UsersPage.jsx
import { useEffect, useState } from "react";
import { getUsers, createUser } from "../services/api";
import Topbar from "../components/Topbar";

const ROLES = ["admin", "manager", "salesperson"];
const ROLE_COLORS = { admin: "danger", manager: "warning", salesperson: "success" };

export default function UsersPage() {
  const [users, setUsers]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState({ name: "", email: "", role: "salesperson", region: "" });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const LIMIT = 10;

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await getUsers(p, LIMIT);
      setUsers(res.data.data);
      setTotal(res.data.total);
    } catch {
      // error handled silently
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
      await createUser(form);
      setFormSuccess(`User "${form.name}" created successfully.`);
      setForm({ name: "", email: "", role: "salesperson", region: "" });
      load(1);
    } catch (err) {
      setFormError(err.response?.data?.message ?? "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      <Topbar title="User Management">
        <button className="btn btn-primary btn-sm fw-semibold" onClick={() => setShowModal(true)}>
          <i className="bi bi-person-plus me-1" />Add User
        </button>
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
                    <th style={{ paddingLeft: 20 }}>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr><td colSpan={4} className="text-center text-muted py-4">No users found</td></tr>
                  )}
                  {users.map((u) => (
                    <tr key={u.user_id}>
                      <td style={{ paddingLeft: 20 }}>
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold"
                               style={{ width: 32, height: 32, fontSize: 12, flexShrink: 0 }}>
                            {u.name?.[0]?.toUpperCase()}
                          </div>
                          <span className="fw-semibold">{u.name}</span>
                        </div>
                      </td>
                      <td className="text-muted">{u.email}</td>
                      <td>
                        <span className={`badge bg-${ROLE_COLORS[u.role]}-subtle text-${ROLE_COLORS[u.role]} px-2 py-1`}
                              style={{ textTransform: "capitalize", fontWeight: 600 }}>
                          {u.role}
                        </span>
                      </td>
                      <td className="text-muted" style={{ fontSize: 13 }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <small className="text-muted">Showing {users.length} of {total} users</small>
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

      {/* ── Modal ── */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "0.75rem", border: "none" }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Add New User</h5>
                <button className="btn-close" onClick={() => { setShowModal(false); setFormError(""); setFormSuccess(""); }} />
              </div>
              <div className="modal-body">
                {formError   && <div className="alert alert-danger py-2">{formError}</div>}
                {formSuccess && <div className="alert alert-success py-2">{formSuccess}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Full Name</label>
                    <input className="form-control" placeholder="Jane Doe" value={form.name}
                           onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Email</label>
                    <input type="email" className="form-control" placeholder="jane@company.com" value={form.email}
                           onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Role</label>
                    <select className="form-select" value={form.role}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}>
                      {ROLES.map((r) => <option key={r} value={r} style={{ textTransform: "capitalize" }}>{r}</option>)}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Region</label>
                    <input className="form-control" placeholder="North, South…" value={form.region}
                           onChange={(e) => setForm({ ...form, region: e.target.value })} required />
                  </div>
                  <button type="submit" className="btn btn-primary w-100 fw-semibold" disabled={submitting}>
                    {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Creating…</> : "Create User"}
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
