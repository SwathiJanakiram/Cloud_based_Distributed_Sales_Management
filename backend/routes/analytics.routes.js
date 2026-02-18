const express = require("express");
const router = express.Router();
const {
  getSummary,
  getRevenueByRegion,
  getTopProducts
} = require("../controllers/analytics.controller");

const { verifyFirebaseToken, authorizeRoles } = 
  require("../middleware/firebaseAuth.middleware");

router.use(verifyFirebaseToken);

router.get("/total", getSummary);
router.get("/region", getRevenueByRegion);
router.get("/top-products", getTopProducts);

module.exports = router;
