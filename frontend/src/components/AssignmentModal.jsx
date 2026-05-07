import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import {
  getAssignments,
  getStores,
  getWarehouses,
  createAssignment,
  deleteAssignment,
} from "../services/api";

const ROLE_META = {
  regional_manager: {
    label: "Regional Manager",
    color: "#185FA5",
    bg: "#E6F1FB",
    allowedTypes: ["store", "warehouse"],
  },
  store_manager: {
    label: "Store Manager",
    color: "#854F0B",
    bg: "#FAEEDA",
    allowedTypes: ["store"],
  },
  salesperson: {
    label: "Salesperson",
    color: "#3B6D11",
    bg: "#EAF3DE",
    allowedTypes: ["store"],
  },
};

export default function AssignmentModal({ user, onClose }) {
  const [assignments, setAssignments]   = useState([]);
  const [stores, setStores]             = useState([]);
  const [warehouses, setWarehouses]     = useState([]);
  const [locationType, setLocationType] = useState("store");
  const [locationId, setLocationId]     = useState("");
  const [loadingData, setLoadingData]   = useState(true);
  const [adding, setAdding]             = useState(false);
  const [removingId, setRemovingId]     = useState(null);

  const meta = ROLE_META[user?.role] ?? ROLE_META.salesperson;

  // ── Load existing assignments + location lists ──────────────────────────
  const loadAll = useCallback(async () => {
    setLoadingData(true);
    try {
      const [aRes, sRes, wRes] = await Promise.all([
        getAssignments(user.user_id),
        getStores(),
        getWarehouses(),
      ]);
      setAssignments(aRes.data.data ?? []);
      setStores(sRes.data.data ?? []);
      setWarehouses(wRes.data.data ?? []);
    } catch {
      toast.error("Failed to load assignment data");
    } finally {
      setLoadingData(false);
    }
  }, [user.user_id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Reset location selection when type changes
  useEffect(() => {
    setLocationId("");
  }, [locationType]);

  // ── Derived ─────────────────────────────────────────────────────────────
  const assignedIds = assignments
    .filter((a) => a.location_type === locationType)
    .map((a) => Number(a.location_id));

  const locationOptions =
    locationType === "store"
      ? stores.filter((s) => !assignedIds.includes(s.store_id))
      : warehouses.filter((w) => !assignedIds.includes(w.warehouse_id));

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!locationId) return;
    setAdding(true);
    try {
      await createAssignment({
        user_id: user.user_id,
        location_id: Number(locationId),
        location_type: locationType,
      });
      toast.success("Assignment added");
      setLocationId("");
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to add assignment");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (assignmentId) => {
    setRemovingId(assignmentId);
    try {
      await deleteAssignment(assignmentId);
      toast.success("Assignment removed");
      loadAll();
    } catch {
      toast.error("Failed to remove assignment");
    } finally {
      setRemovingId(null);
    }
  };

  // ── Group current assignments by type for display ────────────────────────
  const grouped = assignments.reduce((acc, a) => {
    const key = a.location_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="modal show d-block"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div
          className="modal-content"
          style={{ borderRadius: "0.875rem", border: "none", overflow: "hidden" }}
        >
          {/* ── Header ── */}
          <div
            className="modal-header border-0"
            style={{ background: "#f8f9fa", padding: "1.25rem 1.5rem" }}
          >
            <div className="d-flex align-items-center gap-3">
              {/* Avatar */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: meta.bg,
                  color: meta.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: 15,
                  flexShrink: 0,
                }}
              >
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0" style={{ fontSize: 16 }}>
                  {user.name}
                </h5>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    background: meta.bg,
                    color: meta.color,
                    borderRadius: 999,
                    padding: "1px 10px",
                    textTransform: "capitalize",
                  }}
                >
                  {meta.label}
                </span>
              </div>
            </div>
            <button className="btn-close" onClick={onClose} />
          </div>

          {/* ── Body ── */}
          <div className="modal-body" style={{ padding: "1.5rem" }}>
            {loadingData ? (
              <LoadingSkeleton />
            ) : (
              <>
                {/* ── Add New Assignment ── */}
                <p
                  className="fw-semibold mb-2"
                  style={{ fontSize: 13, color: "#6c757d", textTransform: "uppercase", letterSpacing: "0.05em" }}
                >
                  Add assignment
                </p>

                <div
                  className="p-3 mb-4"
                  style={{
                    background: "#f8f9fa",
                    borderRadius: "0.625rem",
                    border: "1px solid #e9ecef",
                  }}
                >
                  {/* Type selector — only show tabs for roles that allow both */}
                  {meta.allowedTypes.length > 1 && (
                    <div className="d-flex gap-2 mb-3">
                      {meta.allowedTypes.map((t) => (
                        <button
                          key={t}
                          className="btn btn-sm"
                          style={{
                            borderRadius: "999px",
                            padding: "4px 16px",
                            fontSize: 13,
                            fontWeight: 500,
                            background: locationType === t ? "#0d6efd" : "white",
                            color: locationType === t ? "white" : "#495057",
                            border: `1px solid ${locationType === t ? "#0d6efd" : "#dee2e6"}`,
                            transition: "all 0.15s",
                          }}
                          onClick={() => setLocationType(t)}
                        >
                          <i
                            className={`bi ${t === "store" ? "bi-shop" : "bi-building"} me-1`}
                          />
                          {t === "store" ? "Store" : "Warehouse"}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="d-flex gap-2">
                    <select
                      className="form-select form-select-sm"
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                      style={{ fontSize: 13 }}
                    >
                      <option value="">
                        {locationOptions.length === 0
                          ? `All ${locationType}s already assigned`
                          : `— Select a ${locationType} —`}
                      </option>
                      {locationOptions.map((loc) => {
                        const id   = locationType === "store" ? loc.store_id : loc.warehouse_id;
                        const name = locationType === "store" ? loc.store_name : loc.warehouse_name;
                        const sub  = locationType === "store" ? loc.city : loc.region;
                        return (
                          <option key={id} value={id}>
                            {name}{sub ? ` — ${sub}` : ""}
                          </option>
                        );
                      })}
                    </select>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ whiteSpace: "nowrap", fontSize: 13, fontWeight: 500 }}
                      onClick={handleAdd}
                      disabled={!locationId || adding}
                    >
                      {adding ? (
                        <span className="spinner-border spinner-border-sm me-1" />
                      ) : (
                        <i className="bi bi-plus-lg me-1" />
                      )}
                      Add
                    </button>
                  </div>
                </div>

                {/* ── Current Assignments ── */}
                <p
                  className="fw-semibold mb-2"
                  style={{ fontSize: 13, color: "#6c757d", textTransform: "uppercase", letterSpacing: "0.05em" }}
                >
                  Current assignments
                  <span
                    className="ms-2"
                    style={{
                      fontSize: 11,
                      background: "#e9ecef",
                      color: "#495057",
                      borderRadius: 999,
                      padding: "1px 8px",
                      fontWeight: 600,
                    }}
                  >
                    {assignments.length}
                  </span>
                </p>

                {assignments.length === 0 ? (
                  <div
                    className="text-center py-4"
                    style={{
                      border: "1.5px dashed #dee2e6",
                      borderRadius: "0.625rem",
                      color: "#adb5bd",
                      fontSize: 14,
                    }}
                  >
                    <i className="bi bi-geo-alt d-block mb-1" style={{ fontSize: 24 }} />
                    No locations assigned yet
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {["store", "warehouse"].map((type) =>
                      grouped[type]?.length ? (
                        <div key={type}>
                          {/* Type group header */}
                          <div
                            className="d-flex align-items-center gap-2 mb-2"
                            style={{ fontSize: 12, color: "#6c757d", fontWeight: 600 }}
                          >
                            <i
                              className={`bi ${type === "store" ? "bi-shop" : "bi-building"}`}
                              style={{ fontSize: 13 }}
                            />
                            {type === "store" ? "Stores" : "Warehouses"}
                            <div
                              style={{
                                flex: 1,
                                height: "0.5px",
                                background: "#dee2e6",
                                marginLeft: 4,
                              }}
                            />
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                            }}
                          >
                            {grouped[type].map((a) => (
                              <AssignmentRow
                                key={a.assignment_id}
                                assignment={a}
                                removing={removingId === a.assignment_id}
                                onRemove={() => handleRemove(a.assignment_id)}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Footer ── */}
          <div
            className="modal-footer border-0"
            style={{ background: "#f8f9fa", padding: "0.875rem 1.5rem" }}
          >
            <span style={{ fontSize: 12, color: "#adb5bd" }}>
              Changes take effect immediately
            </span>
            <button className="btn btn-sm btn-outline-secondary ms-auto" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function AssignmentRow({ assignment, removing, onRemove }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        background: "white",
        border: "1px solid #e9ecef",
        borderRadius: "0.5rem",
        transition: "opacity 0.2s",
        opacity: removing ? 0.5 : 1,
      }}
    >
      <div className="d-flex align-items-center gap-2">
        <i
          className={`bi ${assignment.location_type === "store" ? "bi-shop" : "bi-building"}`}
          style={{ fontSize: 14, color: "#6c757d" }}
        />
        <div>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#212529" }}>
            {assignment.location_name}
          </span>
          {assignment.region && (
            <span style={{ fontSize: 11, color: "#adb5bd", marginLeft: 6 }}>
              {assignment.region}
            </span>
          )}
        </div>
      </div>
      <button
        className="btn btn-sm"
        style={{
          padding: "2px 8px",
          fontSize: 12,
          color: "#dc3545",
          border: "1px solid #f5c2c7",
          borderRadius: "0.375rem",
          background: "white",
        }}
        onClick={onRemove}
        disabled={removing}
        title="Remove assignment"
      >
        {removing ? (
          <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }} />
        ) : (
          <>
            <i className="bi bi-x me-1" />
            Remove
          </>
        )}
      </button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div>
      {[80, 60, 90, 70].map((w, i) => (
        <div
          key={i}
          style={{
            height: 38,
            background: "#f0f0f0",
            borderRadius: "0.5rem",
            marginBottom: 8,
            width: `${w}%`,
            animation: "pulse 1.4s ease-in-out infinite",
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}