import { useEffect, useState } from "react";
import {
  createSale,
  getStores,
  getSalespersonsByStore,
  getProductsByStore,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import Topbar from "../components/Topbar";
import { toast } from "react-toastify";
import Skeleton from "react-loading-skeleton";

export default function NewSalesPage() {
  const { user, role } = useAuth();

  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [salespersons, setSalespersons] = useState([]);

  const [form, setForm] = useState({
    product_id: "",
    store_id: "",
    quantity: 1,
    salesperson_id: "",
  });

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Load initial data
 useEffect(() => {
  (async () => {
    try {
      setPageLoading(true);

      const promises = {
        stores: null,
        products: null,
        salespersons: null,
      };

      // Admin & Regional Manager
      if (role === "admin" || role === "regional_manager") {
        promises.stores = getStores();
      }

      // Store Manager
      if (role === "store_manager") {
        promises.products = getProductsByStore();
        promises.salespersons = getSalespersonsByStore();
      }

      // Salesperson
      if (role === "salesperson") {
        promises.products = getProductsByStore();
      }

      const [
        storesRes,
        productsRes,
        salespersonsRes,
      ] = await Promise.all([
        promises.stores,
        promises.products,
        promises.salespersons,
      ]);

      setStores(storesRes?.data?.data ?? []);
      setProducts(productsRes?.data?.data ?? []);
      setSalespersons(salespersonsRes?.data?.data ?? []);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load data.");
    } finally {
      setPageLoading(false);
    }
  })();
}, [role]);

  // Load products + salespersons when store changes
  useEffect(() => {
    if (!form.store_id) return;

    (async () => {
      try {
        const [s, p] = await Promise.all([
          getSalespersonsByStore(form.store_id),
          getProductsByStore(form.store_id),
        ]);

        setProducts(p?.data?.data ?? []);
        setSalespersons(s?.data?.data ?? []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data.");
      }
    })();
  }, [form.store_id]);

  // Auto-clear messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setError("");
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      form.product_id == "" ||
      form.store_id == "" ||
      form.salesperson_id == "" ||
      form.quantity == ""
    ) {
      return setError("All Fields Required !!");
    }

    if (
      Number(form.quantity) <= 0 ||
      !Number.isInteger(Number(form.quantity))
    ) {
      return setError("Quantity must be a positive whole number.");
    }

    setLoading(true);
    setError("");

    try {
      const resp = await createSale({
        product_id: Number(form.product_id),
        store_id: Number(form.store_id),
        salesperson_id: Number(form.salesperson_id),
        quantity: Number(form.quantity),
      });

      const data = resp.data.data;

      toast.success(
        `Sale recorded successfully! Sale #${data.sale_id} • ₹${Number(
          data.total_amount,
        ).toLocaleString()}`,
      );

      setForm({
        product_id: "",
        store_id: "",
        quantity: 1,
        salesperson_id: "",
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Failed to record sale. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find(
    (p) => String(p.product_id) === String(form.product_id),
  );

  const estTotal = selectedProduct
    ? parseFloat(selectedProduct.unit_price) * Number(form.quantity)
    : null;

  return (
    <>
      <Topbar title="New Sale">
        <span className="badge bg-primary-subtle text-primary fw-semibold px-3 py-2">
          <i className="bi bi-cart-plus me-1" />
          Sale Entry
        </span>
      </Topbar>

      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div
            className="card border-0 shadow-sm"
            style={{ borderRadius: "0.75rem" }}
          >
            <div className="card-body p-4">
              <h6 className="fw-bold mb-4">
                <i className="bi bi-receipt me-2 text-primary" />
                Record a Sale Transaction
              </h6>

              {pageLoading ? (
                <>
                  <Skeleton height={40} className="mb-3" />
                  <Skeleton height={40} className="mb-3" />
                  <Skeleton height={40} className="mb-3" />
                </>
              ) : (
                <>
                  {/* Error */}
                  {error && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
                      <i className="bi bi-exclamation-circle-fill" />
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    {/* Store */}
                    {role !== "store_manager" &&
                      role !== "salesperson" && (
                        <div className="mb-3">
                          <label className="form-label fw-semibold">
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
                      )}

                    {/* Product */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Product</label>
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
                            {p.product_name} — ₹
                            {Number(p.unit_price).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Quantity</label>
                      <input
                        type="number"
                        name="quantity"
                        className="form-control"
                        min={1}
                        step={1}
                        value={form.quantity}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Salesperson */}
                    {role !== "salesperson" && (
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Salesperson
                        </label>
                        <select
                          name="salesperson_id"
                          className="form-select"
                          value={form.salesperson_id}
                          onChange={handleChange}
                          required
                        >
                          <option value="">— Select a Salesperson —</option>
                          {salespersons.map((sp) => (
                            <option key={sp.user_id} value={sp.user_id}>
                              {sp.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Estimate */}
                    {estTotal !== null && (
                      <div className="alert alert-info">
                        Estimated Total: ₹{Number(estTotal).toLocaleString()}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Confirm Sale"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
