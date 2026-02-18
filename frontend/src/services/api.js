// src/services/api.js
import axios from "axios";
import { auth } from "../config/firebase";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Automatically attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Analytics ───────────────────────────────────────────────
export const getSummary    = () => api.get("/analytics/summary");
export const getByRegion   = () => api.get("/analytics/region");
export const getTopProducts = () => api.get("/analytics/top-products");

// ─── Sales ───────────────────────────────────────────────────
export const createSale = (data) => api.post("/sales", data);

// ─── Products ────────────────────────────────────────────────
export const getProducts   = (page = 1, limit = 10) => api.get(`/products?page=${page}&limit=${limit}`);
export const createProduct = (data) => api.post("/products", data);

// ─── Stores ──────────────────────────────────────────────────
export const getStores   = () => api.get("/stores");
export const createStore = (data) => api.post("/stores", data);

// ─── Users ───────────────────────────────────────────────────
export const getUsers   = (page = 1, limit = 10) => api.get(`/users?page=${page}&limit=${limit}`);
export const createUser = (data) => api.post("/users", data);

export default api;
