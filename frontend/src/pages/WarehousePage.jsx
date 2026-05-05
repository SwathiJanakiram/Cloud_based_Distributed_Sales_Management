// src/pages/WarehousePage.jsx
import { useEffect, useState } from "react";
import {
  createWarehouse,
  getWarehouses,
  editWarehouse,
  deleteWarehouse,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import Topbar from "../components/Topbar";
import { toast } from "react-toastify";
import Skeleton from "react-loading-skeleton";

export default function WarehousePage() {
  const { role } = useAuth();
  const [warehouse, setWarehouse] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [form, setForm] = useState({
    warehouse_id: "",
    warehouse_name: "",
    address: "",
    region_id: "",
    longitude: "",
    latitude: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await getWarehouses();
      setWarehouse(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  function validateWarehouse(form) {
    const errors = {};

    // Warehouse name
    if (!form.warehouse_name || form.warehouse_name.trim() === "") {
      errors.warehouse_name = "Warehouse name is required";
    } else if (form.warehouse_name.length < 3) {
      errors.warehouse_name = "Warehouse name must be at least 3 characters";
    }

    // Address
    if (!form.address || form.address.trim() === "") {
      errors.address = "Address is required";
    }

    // Region
    if (!form.region_id) {
      errors.region_id = "Region is required";
    }

    // Latitude
    const lat = parseFloat(form.latitude);
    if (isNaN(lat)) {
      errors.latitude = "Latitude must be a number";
    } else if (lat < -90 || lat > 90) {
      errors.latitude = "Latitude must be between -90 and 90";
    }

    // Longitude
    const lng = parseFloat(form.longitude);
    if (isNaN(lng)) {
      errors.longitude = "Longitude must be a number";
    } else if (lng < -180 || lng > 180) {
      errors.longitude = "Longitude must be between -180 and 180";
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    ;

    const { valid, errors } = validateWarehouse(form);

    if (!valid) {
      toast.error(Object.values(errors)[0]); // first error
      setSubmitting(false);
      return;
    }

    try {
      await createWarehouse(form);
      toast.success(`Warehouse "${form.warehouse_name}" created.`);
      clearForm()
      load();
    } catch (err) {
      toast.error(
        err.response?.data?.message ?? "Failed to create warehouse.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    ;

    const { valid, errors } = validateWarehouse(form);

    if (!valid) {
      toast.error(Object.values(errors)[0]); // first error
      setSubmitting(false);
      return;
    }
    try {
      await editWarehouse(form.warehouse_id, form);
      toast.success(` "${form.warehouse_name}" updated.`);
      clearForm()
      load();
    } catch (err) {
      toast.error(
        err.response?.data?.message ?? "Failed to Update warehouse.",
      );
    } finally {
      setSubmitting(false);
      setIsEdit(false);
    }
  };
  const handleDelete = async (id) => {
    setSubmitting(true);
    try {
      await deleteWarehouse(id);
      toast.success(`Warehouse "${form.warehouse_name}" deleted.`);
     clearForm()
      load();
    } catch (err) {
      toast.error(
        err.response?.data?.message ?? "Failed to Delete warehouse.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  const clearForm = () =>{
    setForm({
        warehouse_name: "",
        address: "",
        region_id: "",
        longitude: "",
        latitude: "",
      });
      setSubmitting(false);
      setIsEdit(false)
      setShowDeleteModal(false);
      setShowModal(false);
  }

  const regionColors = {
    North: "primary",
    South: "success",
    East: "warning",
    West: "info",
    Central: "warning",
  };

  return (
    <>
      <Topbar title="Warehouses">
        {role === "admin" && (
          <button
            className="btn btn-primary btn-sm fw-semibold"
            onClick={() => setShowModal(true)}
          >
            <i className="bi bi-plus-lg me-1" />
            Add Warehouse
          </button>
        )}
      </Topbar>

      {loading ? (
        <div className="row g-3">
        {Array(15)
          .fill()
          .map((_, i) => (
            <div key={i} className="col-sm-6 col-xl-4">
              <div
                className="card border-0 shadow-sm h-100"
                style={{ borderRadius: "0.75rem" }}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <Skeleton width={40} height={40} />

                    <div className="d-flex gap-2">
                      <Skeleton width={60} height={20} />
                      <Skeleton width={30} height={30} />
                      <Skeleton width={30} height={30} />
                    </div>
                  </div>

                  <Skeleton height={18} width="70%" className="mb-2" />
                  <Skeleton height={14} width="50%" className="mb-2" />
                  <Skeleton height={14} width="60%" />
                </div>
              </div>
            </div>
          ))} 
          </div> 
      ) : (
        <div className="row g-3">
          {warehouse.length === 0 && (
            <div className="col-12">
              <div
                className="card border-0 shadow-sm text-center py-5"
                style={{ borderRadius: "0.75rem" }}
              >
                <i
                  className="bi bi-shop text-muted mb-2"
                  style={{ fontSize: 40 }}
                />
                <p className="text-muted">
                  No warehouse yet. Add your first warehouse.
                </p>
              </div>
            </div>
          )}
          {warehouse.map((w) => {
            return (
              <div key={w.warehouse_id} className="col-sm-6 col-xl-4">
                <div
                  className="card border-0 shadow-sm h-100"
                  style={{ borderRadius: "0.75rem" }}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div
                        className="rounded-2 d-flex align-items-center justify-content-center"
                        style={{ width: 40, height: 40, background: "#eff6ff" }}
                      >
                        <i className="bi bi-shop text-primary fs-5" />
                        </div>

                        <div className="d-flex align-items-center gap-2">
                        {/* Edit Button */}
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                              setForm(w);
                              setIsEdit(true);
                              setShowModal(true);
                            
                          }}
                        >
                          <i className="bi bi-pencil" />
                        </button>

                        {/* Delete Button */}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => {
                            {
                              setForm(w); setShowDeleteModal(true);
                            }
                          }}
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </div>
                    <h6 className="fw-bold mb-1 mt-2">{w.warehouse_name}</h6>
                    <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                      <i className="bi bi-geo-alt me-1" />
                      {w.address}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                <h5 className="modal-title fw-bold"> {!isEdit ? "Add New Warehouse" : "Edit Warehouse" }</h5>
                <button
                  className="btn-close"
                  onClick={() => 
                    clearForm()
                  }
                />
              </div>
              <div className="modal-body">
                <form onSubmit={!isEdit ? handleSubmit : handleEdit}>
                  <div className="mb-3">
                    <label
                      className="form-label fw-semibold"
                      style={{ fontSize: 13 }}
                    >
                      Warehouse Name
                    </label>
                    <input
                      className="form-control"
                      placeholder="e.g. Downtown Outlet"
                      value={form.warehouse_name}
                      onChange={(e) =>
                        setForm({ ...form, warehouse_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label
                      className="form-label fw-semibold"
                      style={{ fontSize: 13 }}
                    >
                      Address
                    </label>
                    <input
                      className="form-control"
                      placeholder="e.g. Mumbai"
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                      required
                    />
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
                  <div className="mb-3">
                    <label
                      className="form-label fw-semibold"
                      style={{ fontSize: 13 }}
                    >
                      Latitude
                    </label>
                    <input
                      className="form-control"
                      placeholder="e.g. 28.63293800"
                      value={form.latitude}
                      onChange={(e) =>
                        setForm({ ...form, latitude: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label
                      className="form-label fw-semibold"
                      style={{ fontSize: 13 }}
                    >
                      Longitude
                    </label>
                    <input
                      className="form-control"
                      placeholder="e.g. 77.21955400"
                      value={form.longitude}
                      onChange={(e) =>
                        setForm({ ...form, longitude: e.target.value })
                      }
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary w-100 fw-semibold"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        {!isEdit ? "Creating... " : "Updating..."}
                      </>
                    ) : !isEdit ? (
                      "Create Warehouse"
                    ) : (
                      "Update Warehouse"
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
          tabIndex="-1"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content"
              style={{ borderRadius: "0.75rem", border: "none" }}
            >
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Delete Warehouse</h5>
                <button
                  className="btn-close"
                  onClick={() => clearForm()}
                />
              </div>
              <div className="modal-body">
                <h6 className="fw-bold mb-1 mt-2">
                  Are you sure want to delete {form.warehouse_name}?
                </h6>
                <button
                  type="button"
                  className="btn btn-danger w-100 fw-semibold"
                  onClick={() => handleDelete(form.warehouse_id)}
                  disabled={submitting}
                >
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
