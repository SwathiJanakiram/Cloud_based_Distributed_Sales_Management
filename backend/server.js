require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { apiLimiter } = require("./middleware/rateLimit.middleware");
const { verifyFirebaseToken } = 
  require("../middleware/firebaseAuth.middleware");


const salesRoutes = require("./routes/sales.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const usersRoutes = require("./routes/users.routes");
const productsRoutes = require("./routes/products.routes");
const storesRoutes = require("./routes/stores.routes");
const errorHandler = require("./utils/errorHandler");


const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// app.get("/health", (req, res) => {
//   res.status(200).json({ status: "OK" });
// });

app.use(apiLimiter);
router.use(verifyFirebaseToken);

app.use("/api/v1/sales", salesRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/products", productsRoutes);
app.use("/api/v1/stores", storesRoutes);
app.use("/api/v1/users", usersRoutes);

app.use(errorHandler);

const PORT = 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

