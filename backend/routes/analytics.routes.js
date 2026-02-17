const express = require("express");
const router = express.Router();
const {
  getTotalRevenue,
  getRevenueByRegion,
  getTopProducts
} = require("../controllers/analytics.controller");

const { verifyFirebaseToken, authorizeRoles } = 
  require("../middleware/firebaseAuth.middleware");

router.use(verifyFirebaseToken);

router.get("/total", getTotalRevenue);
router.get("/region", getRevenueByRegion);
router.get("/top-products", getTopProducts);

module.exports = router;
