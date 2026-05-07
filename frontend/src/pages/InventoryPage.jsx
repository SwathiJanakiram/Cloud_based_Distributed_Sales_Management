import { useEffect, useState } from "react";
import {
  getInventory,
  syncInventory,
  transferStock,
  getStores,
  getProducts,
  getWarehouses,
  getProductsByWarehouse,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import Topbar from "../components/Topbar";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";

const LOCATION_TYPES = ["store", "warehouse"];

export default function InventoryPage() {
  const { user, role, location_id, location_type } = useAuth();

  const [inventory, setInventory] = useState([]);
  const [stores, setStores] = useState([]);
  const [warehouse, setWarehouse] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouseProducts, setWarehouseProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    location_id: "",
    location_type: "store",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 15;

  const [showSyncForm, setShowSyncForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [syncForm, setSyncForm] = useState({
    product_id: "",
    location_id: "",
    location_type: "store",
    quantity: "",
    low_stock_limit: 10,
  });
  const [transferForm, setTransferForm] = useState({
    product_id: "",
    from_location_id: "",
    from_location_type: "warehouse",
    to_location_id: "",
    to_location_type: "store",
    quantity: "",
  });

  

  const loadInventory = async () => {
    setLoading(true);
    setError("");
    console.log(location_id,location_type);
    try {
      const res = await getInventory({
        location_id: filters.location_id || undefined,
        location_type: filters.location_type ,
        page,
        limit: LIMIT,
      });
      
      setInventory(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
    } catch {
      toast.error("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const loadDropdowns = async () => {
  try {
    const requests = [getProducts(1, 100)];

    // Admin
    if (role === "admin") {
      requests.push(getStores());
      requests.push(getWarehouses());
    }

    // Regional Manager
    else if (role === "regional_manager") {
      requests.push(getStores());
    }

    const responses = await Promise.all(requests);

    // Products always first
    const productsRes = responses[0];
    setProducts(productsRes.data.data ?? []);

    // Admin
    if (role === "admin") {
      const storesRes = responses[1];
      const warehouseRes = responses[2];

      setStores(storesRes.data.data ?? []);
      setWarehouse(warehouseRes.data.data ?? []);
    }

    // Regional Manager
    else if (role === "regional_manager") {
      const storesRes = responses[1];
      setStores(storesRes.data.data ?? []);
    }

  } catch (error) {
    console.error(error);
    toast.error("Failed to load data.");
  }
};
  useEffect(() => {
    loadDropdowns();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await getProductsByWarehouse(transferForm.from_location_id);
        setWarehouseProducts(res.data.data ?? []);
      } catch {
        toast.error("Failed to load data.");
      }
    };

    if (transferForm.from_location_id) {
      loadProducts();
    }
  }, [transferForm.from_location_id]);

  useEffect(() => {
    loadInventory();
  }, [filters, page]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    setFilters((prev) => ({
      ...prev,
      ...(name === "location_type" && { location_id: "" }),
      [name]: value,
    }));

    setPage(1);
  };

  const handleSyncChange = (e) => {
    if (e.target.name === "location_type") {
      setSyncForm({
        ...syncForm,
        [e.target.name]: e.target.value,
        location_id: "",
      });
    } else {
      setSyncForm({ ...syncForm, [e.target.name]: e.target.value });
    }
  };
  const handleTransferChange = (e) => {
    setTransferForm({
      ...transferForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSync = async (e) => {
    e.preventDefault();
    setSyncLoading(true);
    try {
      await syncInventory({
        product_id: Number(syncForm.product_id),
        location_id: Number(syncForm.location_id) ||location_id,
        location_type: syncForm.location_type || location_type,
        quantity: Number(syncForm.quantity),
        low_stock_threshold: Number(syncForm.low_stock_limit),
      });
      toast.success("Stock synced successfully.");
      setSyncForm({
        product_id: "",
        location_id: "",
        location_type: "store",
        quantity: "",
        low_stock_limit: 10,
      });
      setShowSyncForm(false);
      loadInventory();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Sync failed.");
    } finally {
      setSyncLoading(false);
    }
  };
  const handleTransfer = async (e) => {
    e.preventDefault();
    setSyncLoading(true);

    try {
      await transferStock({
        product_id: Number(transferForm.product_id),
        from_location_id: Number(transferForm.from_location_id) || location_id,
        from_location_type: transferForm.from_location_type || location_type,
        to_location_id: Number(transferForm.to_location_id),
        to_location_type: transferForm.to_location_type,
        quantity: Number(transferForm.quantity),
      });

      toast.success("Stock transferred successfully");

      setTransferForm({
        product_id: "",
        from_location_id: "",
        from_location_type: "warehouse",
        to_location_id: "",
        to_location_type: "store",
        quantity: "",
      });

      setShowTransferForm(false);
      loadInventory();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Sync failed.");
    } finally {
      setSyncLoading(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const stockLevel = (current, threshold) => {
    const pct = Math.round((current / threshold) * 100);
    if (current <= 0)
      return {
        label: "Out of stock",
        cls: "bg-danger-subtle text-danger",
        pct: 0,
      };
    if (pct <= 30)
      return { label: "Critical", cls: "bg-danger-subtle text-danger", pct };
    if (pct <= 70)
      return { label: "Low", cls: "bg-warning-subtle text-warning", pct };
    return { label: "OK", cls: "bg-success-subtle text-success", pct };
  };

  const clearForm = () => {
    setSyncForm({
      product_id: "",
      location_id: "",
      location_type: "store",
      quantity: "",
      low_stock_limit: 10,
    });
    setTransferForm({
      product_id: "",
      from_location_id: "",
      from_location_type: "warehouse",
      to_location_id: "",
      to_location_type: "store",
      quantity: "",
    });
  };

  return (
    <>
      <Topbar title="Inventory">
        {["admin", "regional_manager", "store_mananger"].includes(role) && !showTransferForm && (
          <button
            className="btn btn-primary btn-sm fw-semibold"
            style={{ borderRadius: "20px", fontSize: 13, marginRight: "10px" }}
            onClick={() => {
              setShowSyncForm(!showSyncForm);
              clearForm();
            }}
          >
            <i
              className={`bi ${showSyncForm ? "bi-x" : "bi-plus-circle"} me-2`}
            />
            {showSyncForm ? "Cancel" : "Sync Stock"}
          </button>
        )}
        {["admin", "regional_manager"].includes(role) && !showSyncForm&& (
          <button
            className="btn btn-primary btn-sm fw-semibold"
            style={{ borderRadius: "20px", fontSize: 13 }}
            onClick={() => {
              setShowTransferForm(!showTransferForm);
              clearForm();
            }}
          >
            <i
              className={`bi ${showTransferForm ? "bi-x" : "bi-arrow-left-right"} me-2`}
            />
            {showTransferForm ? "Cancel" : "Transfer Stock"}
          </button>
        )}
      </Topbar>

      {/* Sync Form */}
      {(showSyncForm || showTransferForm) && (
        <div
          className="card border-0 shadow-sm mb-4"
          style={{ borderRadius: "0.75rem", border: "1px solid #bfdbfe" }}
        >
          <div className="card-body p-4">
            <h6 className="fw-bold mb-4" style={{ color: "#0f172a" }}>
              <i className="bi bi-arrow-repeat me-2 text-primary" />
              <h6>
                {showTransferForm ? "Transfer Stock" : "Add / Update Stock"}
              </h6>
            </h6>

            {showSyncForm && (
              <form onSubmit={handleSync}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label
                      className="form-label fw-semibold"
                      style={{ fontSize: 12 }}
                    >
                      Product
                    </label>
                    <select
                      name="product_id"
                      className="form-select form-select-sm"
                      value={syncForm.product_id}
                      onChange={handleSyncChange}
                      required
                    >
                      <option value="">— Select —</option>
                      {products.map((p) => (
                        <option key={p.product_id} value={p.product_id}>
                          {p.product_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  { role === "admin" && (<>

                  <div className="col-md-3">
                    <label
                      className="form-label fw-semibold"
                      style={{ fontSize: 12 }}
                    >
                      Location Type
                    </label>
                    <select
                      name="location_type"
                      className="form-select form-select-sm"
                      value={syncForm.location_type}
                      onChange={handleSyncChange}
                      required
                    >
                      {LOCATION_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label
                      className="form-label fw-semibold"
                      style={{ fontSize: 12 }}
                    >
                      {syncForm.location_type === "store"
                        ? "Store"
                        : "Warehouse"}{" "}
                      ID
                    </label>
                    {syncForm.location_type === "store" ? (
                      <select
                        name="location_id"
                        className="form-select form-select-sm"
                        value={syncForm.location_id}
                        onChange={handleSyncChange}
                        required
                      >
                        <option value="">— Select —</option>
                        {stores.map((s) => (
                          <option key={s.store_id} value={s.store_id}>
                            {s.store_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        name="location_id"
                        className="form-select form-select-sm"
                        value={syncForm.location_id}
                        onChange={handleSyncChange}
                        required
                      >
                        <option value="">— Select —</option>
                        {warehouse.map((w) => (
                          <option key={w.warehouse_id} value={w.warehouse_id}>
                            {w.warehouse_name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  </>)}

                  <div className="col-md-2">
                    <label
                      className="form-label fw-semibold"
                      style={{ fontSize: 12 }}
                    >
                      Quantity to Add
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      className="form-control form-control-sm"
                      placeholder="e.g. 50"
                      min={1}
                      value={syncForm.quantity}
                      onChange={handleSyncChange}
                      required
                    />
                  </div>

                  <div className="col-md-2">
                    <label
                      className="form-label fw-semibold"
                      style={{ fontSize: 12 }}
                    >
                      Low Stock Limit
                    </label>
                    <input
                      type="number"
                      name="low_stock_limit"
                      className="form-control form-control-sm"
                      min={1}
                      value={syncForm.low_stock_limit}
                      onChange={handleSyncChange}
                      required
                    />
                  </div>

                  <div className="col-md-2 d-flex align-items-end">
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm w-100 fw-semibold"
                      disabled={syncLoading}
                    >
                      {syncLoading ? (
                        <span className="spinner-border spinner-border-sm" />
                      ) : (
                        <>
                          <i className="bi bi-arrow-repeat me-1" />
                          Sync
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
            {showTransferForm && (
              <form onSubmit={handleTransfer}>
                <div className="row g-3">
                  {role === "admin" && (<div className="col-md-4">
                    <label
                      className="form-label fw-semibold"
                      style={{ fontSize: 12 }}
                    >
                      From Warehouse
                    </label>
                    <select
                      name="from_location_id"
                      className="form-select form-select-sm"
                      value={transferForm.from_location_id}
                      onChange={handleTransferChange}
                      required
                    >
                      <option value="">— Select —</option>
                      {warehouse.map((w) => (
                        <option key={w.warehouse_id} value={w.warehouse_id}>
                          {w.warehouse_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  )}
                  <div className="col-md-4">
                    <label
                      className="form-label fw-semibold"
                      style={{ fontSize: 12 }}
                    >
                      To Store
                    </label>
                    <select
                      name="to_location_id"
                      className="form-select form-select-sm"
                      value={transferForm.to_location_id}
                      onChange={handleTransferChange}
                      required
                    >
                      <option value="">— Select —</option>
                      {stores.map((s) => (
                        <option key={s.store_id} value={s.store_id}>
                          {s.store_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label
                      className="form-label fw-semibold"
                      style={{ fontSize: 12 }}
                    >
                      Product
                    </label>
                    <select
                      name="product_id"
                      className="form-select form-select-sm"
                      value={transferForm.product_id}
                      onChange={handleTransferChange}
                      required
                    >
                      <option value="">— Select —</option>
                      {warehouseProducts.map((p) => (
                        <option key={p.product_id} value={p.product_id}>
                          {p.product_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label
                      className="form-label fw-semibold"
                      style={{ fontSize: 12 }}
                    >
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      className="form-control form-control-sm"
                      value={transferForm.quantity}
                      onChange={handleTransferChange}
                      required
                      min={1}
                    />
                  </div>
                  <div className="col-md-2 d-flex align-items-end">
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm w-100"
                      disabled={syncLoading}
                    >
                      {syncLoading ? (
                        <span className="spinner-border spinner-border-sm" />
                      ) : (
                        "Transfer"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {role==="admin" && (
        <>

      {/* Filters */}
      <div
        className="card border-0 shadow-sm mb-4"
        style={{ borderRadius: "0.75rem" }}
      >
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label
                className="form-label fw-semibold mb-1"
                style={{ fontSize: 12 }}
              >
                Location Type
              </label>
              <select
                name="location_type"
                className="form-select form-select-sm"
                value={filters.location_type}
                onChange={handleFilterChange}
              >
                {LOCATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            

            {filters.location_type === "store" ? (
              <div className="col-md-4">
                <label
                  className="form-label fw-semibold mb-1"
                  style={{ fontSize: 12 }}
                >
                  Filter by Store
                </label>
                <select
                  name="location_id"
                  className="form-select form-select-sm"
                  value={filters.location_id}
                  onChange={handleFilterChange}
                >
                  <option value="">All Stores</option>
                  {stores.map((s) => (
                    <option key={s.store_id} value={s.store_id}>
                      {s.store_name} — {s.city}
                    </option>
                  ))}
                </select>
              </div>
            ) :  role === "admin" && (
              <div className="col-md-4">
                <label
                  className="form-label fw-semibold mb-1"
                  style={{ fontSize: 12 }}
                >
                  Filter by Warehouse
                </label>
                <select
                  name="location_id"
                  className="form-select form-select-sm"
                  value={filters.location_id}
                  onChange={handleFilterChange}
                >
                  <option value="">All Warehouse</option>
                  {warehouse.map((w) => (
                    <option key={w.warehouse_id} value={w.warehouse_id}>
                      {w.warehouse_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="col-auto ms-auto">
              <span className="text-muted" style={{ fontSize: 12 }}>
                {total} records found
              </span>
            </div>
          </div>
        </div>
      </div>
      </>
)}

      {/* Table */}
      <div
        className="card border-0 shadow-sm"
        style={{ borderRadius: "0.75rem" }}
      >
        <div className="card-body">
          {error && (
            <div className="alert alert-danger mb-3">
              <i className="bi bi-exclamation-triangle me-2" />
              {error}
            </div>
          )}

          {!loading && inventory.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox text-muted fs-2 d-block mb-2" />
              <span className="text-muted">No inventory records found</span>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ fontSize: 12 }}>Product</th>
                    <th style={{ fontSize: 12 }}>Category</th>
                    <th style={{ fontSize: 12 }}>Location</th>
                    <th style={{ fontSize: 12 }}>Type</th>
                    <th style={{ fontSize: 12 }}>Current Stock</th>
                    <th style={{ fontSize: 12 }}>Threshold</th>
                    <th style={{ fontSize: 12 }}>Stock Level</th>
                    <th style={{ fontSize: 12 }}>Last Restocked</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array(10)
                        .fill()
                        .map((_, i) => (
                          <tr key={i}>
                             {Array(8).fill().map((_, i) => (
    <td key={i}><Skeleton /></td>
  ))}
                          </tr>
                        ))
                    : inventory.map((item, i) => {
                        const sl = stockLevel(
                          item.current_stock,
                          item.low_stock_threshold,
                        );
                        return (
                          <tr key={item.inventory_id ?? i}>
                            <td>
                              <div
                                className="fw-semibold"
                                style={{ fontSize: 13 }}
                              >
                                {item.product_name}
                              </div>
                            </td>
                            <td>
                              <span
                                className="badge bg-secondary-subtle text-secondary"
                                style={{ fontSize: 11 }}
                              >
                                {item.category}
                              </span>
                            </td>
                            <td style={{ fontSize: 13, color: "#64748b" }}>
                              {item.location_name ?? `ID: ${item.location_id}`}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  item.location_type === "store"
                                    ? "bg-info-subtle text-info"
                                    : "bg-primary-subtle text-primary"
                                }`}
                                style={{ fontSize: 11 }}
                              >
                                {item.location_type}
                              </span>
                            </td>
                            <td>
                              <span
                                className="fw-bold"
                                style={{
                                  fontSize: 14,
                                  color:
                                    item.current_stock <= 0
                                      ? "#dc2626"
                                      : sl.pct <= 30
                                        ? "#dc2626"
                                        : sl.pct <= 70
                                          ? "#d97706"
                                          : "#16a34a",
                                }}
                              >
                                {item.current_stock}
                              </span>
                            </td>
                            <td style={{ fontSize: 13, color: "#64748b" }}>
                              {item.low_stock_threshold}
                            </td>
                            <td style={{ minWidth: 140 }}>
                              <div className="d-flex align-items-center gap-2">
                                <div
                                  className="progress flex-grow-1"
                                  style={{ height: 6 }}
                                >
                                  <div
                                    className="progress-bar"
                                    style={{
                                      width: `${Math.min(sl.pct, 100)}%`,
                                      backgroundColor:
                                        sl.pct <= 30
                                          ? "#dc2626"
                                          : sl.pct <= 70
                                            ? "#d97706"
                                            : "#16a34a",
                                    }}
                                  />
                                </div>
                                <span
                                  className={`badge ${sl.cls}`}
                                  style={{ fontSize: 10 }}
                                >
                                  {sl.label}
                                </span>
                              </div>
                            </td>
                            <td style={{ fontSize: 12, color: "#64748b" }}>
                              {item.last_restocked_at
                                ? new Date(
                                    item.last_restocked_at,
                                  ).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
              <span className="text-muted" style={{ fontSize: 12 }}>
                Page {page} of {totalPages} · {total} total
              </span>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  style={{ borderRadius: 20, fontSize: 12 }}
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <i className="bi bi-chevron-left" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pg =
                    totalPages <= 5
                      ? i + 1
                      : page <= 3
                        ? i + 1
                        : page >= totalPages - 2
                          ? totalPages - 4 + i
                          : page - 2 + i;
                  return (
                    <button
                      key={pg}
                      className={`btn btn-sm ${
                        pg === page ? "btn-primary" : "btn-outline-secondary"
                      }`}
                      style={{ borderRadius: 20, fontSize: 12, minWidth: 34 }}
                      onClick={() => setPage(pg)}
                    >
                      {pg}
                    </button>
                  );
                })}
                <button
                  className="btn btn-outline-secondary btn-sm"
                  style={{ borderRadius: 20, fontSize: 12 }}
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
    </>
  );
}
