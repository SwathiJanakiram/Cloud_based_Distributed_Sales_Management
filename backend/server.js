require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { v4: uuidv4 } = require("uuid");

const { apiLimiter } = require("./middleware/rateLimit.middleware");
const { verifyFirebaseToken } = require("./middleware/firebaseAuth.middleware");

const salesRoutes = require("./routes/sales.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const usersRoutes = require("./routes/users.routes");
const productsRoutes = require("./routes/products.routes");
const storesRoutes = require("./routes/stores.routes");
const warehouseRoutes = require("./routes/warehouse.router");
const inventoryRoutes = require("./routes/inventory.router");
const auditRoutes = require("./routes/audit.routes");
const assigmnetRoutes = require("./routes/assignmnet.router");
const errorHandler = require("./utils/errorHandler");

const app = express();

app.use(helmet());
app.use(cors());
app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

morgan.token("id", (req) => req.requestId);
app.use(morgan(":id :method :url :status :response-time ms"));

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.use(apiLimiter);

app.use("/api/v1/sales", salesRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/products", productsRoutes);
app.use("/api/v1/stores", storesRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/warehouses", warehouseRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/assignment/", assigmnetRoutes);
app.use("/api/v1/audit", auditRoutes);

app.use(errorHandler);

const PORT = 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
