const express = require("express");
const router = express.Router();

const {
  getInventory,
  syncInventory,
  getLowStockByStore,
  transferStock,
  getProductsByWarehouse,
} = require("../controllers/inventory.controller");

const { body, param, query, validationResult } = require("express-validator");

const {
  verifyFirebaseToken,
  authorizeRoles,
} = require("../middleware/firebaseAuth.middleware");

const AppError = require("../utils/appError");


const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg).join(", ");
    return next(new AppError(messages, 400));
  }
  next();
};


router.use(verifyFirebaseToken);

router.get(
  "/",
  [
    query("location_type")
      .optional()
      .isIn(["store", "warehouse"])
      .withMessage("Invalid location type"),

    query("location_id")
      .optional()
      .isInt()
      .withMessage("Location ID must be a number"),

    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be >= 1"),

    query("limit")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Limit must be >= 1"),
  ],
  validate,
  authorizeRoles("admin", "regional_manager", "store_manager", "salesperson"),
  getInventory
);


router.post(
  "/sync",
  [
    body("product_id").isInt().withMessage("Product ID required"),

    body("location_id").isInt().withMessage("Location ID required"),

    body("location_type")
      .isIn(["store", "warehouse"])
      .withMessage("Invalid location type"),

    body("quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be greater than 0"),

    body("low_stock_threshold")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Threshold must be > 0"),
  ],
  validate,
  authorizeRoles("admin", "regional_manager", "store_manager"),
  syncInventory
);


router.post(
  "/transfer",
  [
    body("product_id").isInt().withMessage("Product ID required"),

    body("from_location_id").isInt().withMessage("From location required"),

    body("to_location_id").isInt().withMessage("To location required"),

    body("from_location_type")
      .isIn(["store", "warehouse"])
      .withMessage("Invalid from location type"),

    body("to_location_type")
      .isIn(["store", "warehouse"])
      .withMessage("Invalid to location type"),

    body("quantity")
      .isInt({ min: 1 })
      .withMessage("Quantity must be greater than 0"),
  ],
  validate,
  authorizeRoles("admin", "regional_manager", "store_manager"),
  transferStock
);


router.get(
  "/low-stock/:store_id",
  param("store_id").isInt().withMessage("Store ID must be a number"),
  validate,
  authorizeRoles("admin", "regional_manager", "store_manager"),
  getLowStockByStore
);
router.get(
  "/getProductsByWarehouse/:warehouse_id",
  param("warehouse_id").isInt().withMessage("Store ID must be a number"),
  validate,
  authorizeRoles("admin", "regional_manager", "store_manager"),
  getProductsByWarehouse
)


module.exports = router;