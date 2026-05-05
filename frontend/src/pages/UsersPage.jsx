// src/pages/UsersPage.jsx
import { useEffect, useState } from "react";
import { getUsers, deleteUser, createUser, editUser } from "../services/api";
import Topbar from "../components/Topbar";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { toast } from "react-toastify";
import Skeleton from "react-loading-skeleton";

const ROLES = ["admin", "regional_manager", "store_manager", "salesperson"];

const ROLE_COLORS = {
  admin: "danger",
  regional_manager: "primary",
  store_manager: "warning",
  salesperson: "success",
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    user_id: "",
    name: "",
    email: "",
    password: "",
    role: "salesperson",
    region_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

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

  useEffect(() => {
    load(page);
  }, [page]);
  function validatePasswordAdvanced(password) {
    const errors = [];

    if (password.length < 8) errors.push("Min 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("Add uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("Add lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("Add number");
    if (!/[@$!%*?&]/.test(password)) errors.push("Add special character");

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const result = validatePasswordAdvanced(form.password);

    if (!result.isValid) {
      toast.error(result.errors.join(", "));
      setSubmitting(false);
      return;
    }
    try {
      await createUser({
        name: form.name,
        email: form.email,
        role: form.role,
        region_id: form.region_id,
        password: form.password,
      });
      toast.success(`User "${form.name}" created successfully.`);
      clearForm();
      load(page);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };
  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await editUser(form.user_id, {
        name: form.name,
        email: form.email,
        role: form.role,
        region_id: form.region_id,
      });
      toast.success(`User "${form.name}" updated successfully.`);
      clearForm();
      load(page);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(selectedUser.firebase_uid);
      setSubmitting(true);
      clearForm();
      load(page);
    } catch (err) {
      toast.error("Failed to delete user");
    }
    {
      setSubmitting(true);
    }
  };

  const clearForm = () => {
    setShowModal(false);
    setIsEdit(false);
    setSubmitting(false);
    setForm({
      name: "",
      email: "",
      password: "",
      role: "salesperson",
      region_id: "",
    });
    setShowDeleteModal(false);
    setSelectedUser(null);
  };
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      <Topbar title="User Management">
        <button
          className="btn btn-primary btn-sm fw-semibold"
          onClick={() => setShowModal(true)}
        >
          <i className="bi bi-person-plus me-1" />
          Add User
        </button>
      </Topbar>

      <div
        className="card border-0 shadow-sm"
        style={{ borderRadius: "0.75rem" }}
      >
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ paddingLeft: 20 }}>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(10)
                    .fill()
                    .map((_,i) => (
                      <tr key={i}>
                        {Array(5)
                          .fill()
                          .map((_, i) => (
                            <td>
                              <Skeleton />
                            </td>
                          ))}
                      </tr>
                    ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.user_id}>
                      <td style={{ paddingLeft: 20 }}>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold"
                            style={{
                              width: 32,
                              height: 32,
                              fontSize: 12,
                              flexShrink: 0,
                            }}
                          >
                            {u.name?.[0]?.toUpperCase()}
                          </div>
                          <span className="fw-semibold">{u.name}</span>
                        </div>
                      </td>
                      <td className="text-muted">{u.email}</td>
                      <td>
                        <span
                          className={`badge bg-${ROLE_COLORS[u.role]}-subtle text-${ROLE_COLORS[u.role]} px-2 py-1`}
                          style={{
                            textTransform: "capitalize",
                            fontWeight: 600,
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="text-muted" style={{ fontSize: 13 }}>
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td class="text-muted">
                        <button
                          class="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            setIsEdit(true);
                            setForm(u);
                            setShowModal(true);
                          }}
                        >
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button
                          class="btn btn-sm btn-outline-danger"
                          onClick={() => {
                            setSelectedUser(u);
                            setShowDeleteModal(true);
                          }}
                        >
                          <i class="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <small className="text-muted">
                Showing {users.length} of {total} users
              </small>
              <div className="d-flex gap-1">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <i className="bi bi-chevron-left" />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    className={`btn btn-sm ${page === i + 1 ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <i className="bi bi-chevron-right" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content"
              style={{ borderRadius: "0.75rem", border: "none" }}
            >
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  {!isEdit ? "Add New User" : "Edit User"}
                </h5>
                <button className="btn-close" onClick={() => clearForm()} />
              </div>
              <div className="modal-body">
                {formError && (
                  <div className="alert alert-danger py-2">{formError}</div>
                )}
                {formSuccess && (
                  <div className="alert alert-success py-2">{formSuccess}</div>
                )}
                <form onSubmit={!isEdit ? handleSubmit : handleEdit}>
                  <div className="mb-3">
                    <label
                      className="form-label fw-semibold"
                      style={{ fontSize: 13 }}
                    >
                      Full Name
                    </label>
                    <input
                      className="form-control"
                      placeholder="Jane Doe"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label
                      className="form-label fw-semibold"
                      style={{ fontSize: 13 }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="jane@company.com"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  {!isEdit && (
                    <div className="mb-3">
                      <label
                        className="form-label fw-semibold"
                        style={{ fontSize: 13 }}
                      >
                        Password
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="**********"
                        value={form.password}
                        onChange={(e) =>
                          setForm({ ...form, password: e.target.value })
                        }
                        required
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label
                      className="form-label fw-semibold"
                      style={{ fontSize: 13 }}
                    >
                      Role
                    </label>
                    <select
                      className="form-select"
                      value={form.role}
                      onChange={(e) =>
                        setForm({ ...form, role: e.target.value })
                      }
                    >
                      {ROLES.map((r) => (
                        <option
                          key={r}
                          value={r}
                          style={{ textTransform: "capitalize" }}
                        >
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label
                      className="form-label fw-semibold"
                      style={{ fontSize: 13 }}
                    >
                      Region
                    </label>
                    <select
                      className="form-select"
                      value={form.region_id}
                      onChange={(e) =>
                        setForm({ ...form, region_id: e.target.value })
                      }
                      required
                    >
                      <option value="">— Select region —</option>
                      {["North", "South", "East", "West", "Central"].map(
                        (r, i) => (
                          <option key={i + 1} value={i + 1}>
                            {r}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary w-100 fw-semibold"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        {!isEdit ? "Creating…" : "Updating.."}
                      </>
                    ) : !isEdit ? (
                      "Create User"
                    ) : (
                      "Update User"
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div
          className="modal show d-block"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "0.75rem" }}>
              <div className="modal-header">
                <h5 className="modal-title text-danger fw-bold">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Confirm Delete
                </h5>
                <button className="btn-close" onClick={() => clearForm()} />
              </div>

              <div className="modal-body">
                <p>
                  Are you sure you want to delete{" "}
                  <strong>{selectedUser?.name}</strong>?
                </p>
                <p className="text-muted mb-0">This action cannot be undone.</p>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={submitting}
                >
                  <i className="bi bi-trash me-1"></i>
                  {submitting ? "Deleting..." : "Delete Warehouse"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
