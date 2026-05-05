const express = require("express");
const router = express.Router();
const {
  getAdminSummary,
  getRevenueByRegion,
  getStorePerformance,
  getTopProducts,
  getSalespersonPerformance,
  getRegionMonthlyTrend,
  getStoreSummary,
  getStoreSalespersonStats,
  getStoreTopProducts,
  getStoreMonthlyTrend
} = require("../controllers/analytics.controller");

const { verifyFirebaseToken, authorizeRoles } = 
  require("../middleware/firebaseAuth.middleware");

router.use(verifyFirebaseToken);

router.get(
  "/admin/summary",
  verifyFirebaseToken,
  authorizeRoles("admin"),
  getAdminSummary
);

router.get(
  "/admin/revenue-region",
  verifyFirebaseToken,
  authorizeRoles("admin"),
  getRevenueByRegion
);

router.get(
  "/admin/store-performance",
  verifyFirebaseToken,
  authorizeRoles("admin"),
  getStorePerformance
);

router.get(
  "/admin/top-products",
  verifyFirebaseToken,
  authorizeRoles("admin"),
  getTopProducts
);


// 🔐 REGIONAL MANAGER
router.get(
  "/region/:region_id/salespersons",
  verifyFirebaseToken,
  authorizeRoles("admin", "regional_manager"),
  getSalespersonPerformance
);

router.get(
  "/region/:region_id/trend",
  verifyFirebaseToken,
  authorizeRoles("admin", "regional_manager"),
  getRegionMonthlyTrend
);


// 🔐 STORE MANAGER
router.get(
  "/store/:store_id/summary",
  verifyFirebaseToken,
  authorizeRoles("admin", "regional_manager", "store_manager"),
  getStoreSummary
);

router.get(
  "/store/:store_id/salespersons",
  verifyFirebaseToken,
  authorizeRoles("admin", "regional_manager", "store_manager"),
  getStoreSalespersonStats
);

router.get(
  "/store/:store_id/top-products",
  verifyFirebaseToken,
  authorizeRoles("admin", "regional_manager", "store_manager"),
  getStoreTopProducts
);

router.get(
  "/store/:store_id/trend",
  verifyFirebaseToken,
  authorizeRoles("admin", "regional_manager", "store_manager"),
  getStoreMonthlyTrend
);
module.exports = router;
