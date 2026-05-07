// src/services/api.js
import axios from "axios";
import { auth } from "../config/firebase";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
});

// Automatically attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken(false);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Analytics ───────────────────────────────────────────────
export const getSummary = (startdate) =>
  api.get(`/analytics/admin/summary?startDate=${startdate}`);
export const getByRegion = (startdate) =>
  api.get(`/analytics/admin/revenue-region?startDate=${startdate}`);
export const getTopProducts = (startdate) =>
  api.get(`/analytics/admin/top-products?startDate=${startdate}`);
export const getStoresByRegion = (id) => api.get(`/stores/region/${id}`);

export const getSalespersonPerformance = (id) =>
  api.get(`/analytics/region/${id}/salespersons`);

export const getRegionMonthlyTrend = (id) =>
  api.get(`/analytics/region/${id}/trend`);

export const getStoreSummary = (id) =>
  api.get(`/analytics/store/${id}/summary`);

export const getStoreSalespersonStats = (id) =>
  api.get(`/analytics/store/${id}/salespersons`);

export const getStoreTopProducts = (id) =>
  api.get(`/analytics/store/${id}/top-products`);

export const getStoreLowStock = (id) => api.get(`/inventory/low-stock/${id}`);

export const getStoreMonthlyTrend = (id) =>
  api.get(`/analytics/store/${id}/trend`);

export const getStorePerformance = (startdate) =>
  api.get(`/analytics/admin/store-performance?startDate=${startdate}`);
export const getMySales = () => api.get(`/sales/my`);

export const getStoreSales = (store_id) => api.get(`/sales/store/${store_id}`);

// ─── Sales ───────────────────────────────────────────────────
export const createSale = (data) => api.post("/sales", data);

// ─── Products ────────────────────────────────────────────────
export const getProducts = (page = 1, limit = 10) =>
  api.get(`/products?page=${page}&limit=${limit}`);
export const createProduct = (data) => api.post("/products", data);
export const editProduct = (id,data) => api.put(`/products/${id}`,data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const getProductsByStore = (store_id) =>
  api.get(`/products/getProductsByStore?store_id=${store_id}`);

// ─── Stores ──────────────────────────────────────────────────
export const getStores = () => api.get("/stores");
export const createStore = (data) => api.post("/stores", data);
export const editStore = (id, data) => api.put(`/stores/${id}`, data);
export const deleteStore = (id) => api.delete(`/stores/${id}`);

// ─── Users ──────────────────────────────────────────────────
export const getUsers = (page = 1, limit = 10) =>
  api.get(`/users?page=${page}&limit=${limit}`);
export const createUser = (data) => api.post("/users", data);
export const editUser = (id,data) => api.put(`/users/${id}`,data);
export const deleteUser = (uid) => api.delete(`/users/${uid}`);
export const getMe = () => api.get("/users/me");
export const getUserName = () => api.get("/users/getUserName");
export const getSalespersonsByStore = (store_id) =>
  api.get("users/getSalespersonsByStore", { params: { store_id } });

// ─── Assignment ─────────────────────────────────────────────────
export const getAssignments= (id) => api.get(`/assignment/${id}`);
export const createAssignment =(data) => api.post("/assignment",data);
export const deleteAssignment =(id,data) =>api.delete(`/assignment/${id}`,data);

// ─── Warehouses ─────────────────────────────────────────────────
export const getWarehouses = (page = 1, limit = 10) =>
  api.get(`/warehouses?page=${page}&limit=${limit}`);
export const createWarehouse = (data) => api.post("/warehouses", data);
export const deleteWarehouse = (id) => api.delete(`/warehouses/${id}`);
export const editWarehouse = (id, data) => api.put(`/warehouses/${id}`, data);

// ─── Inventory ──────────────────────────────────────────────────

export const getInventory = (params) => api.get("/inventory", { params });

export const syncInventory = (data) => api.post("/inventory/sync", data);
  
export const transferStock=(data)=> api.post("/inventory/transfer",data);

export const getProductsByWarehouse=(id) => api.get(`/inventory/getProductsByWarehouse/${id}`)

export const getAuditLogs = (filters) => api.get("/audit", { params: filters });

export const getTest =() => api.get("/users/test");
export default api;
