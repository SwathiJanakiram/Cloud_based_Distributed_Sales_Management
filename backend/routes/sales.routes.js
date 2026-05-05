const express = require("express");
const router = express.Router();
const { createSale, getMySales, getStoreSales } = require("../controllers/sales.controller");
const { body, validationResult } = require("express-validator");
const { strictLimiter } = require("../middleware/rateLimit.middleware");

const { verifyFirebaseToken, authorizeRoles } = 
  require("../middleware/firebaseAuth.middleware");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};
router.use(verifyFirebaseToken);
router.post(
  "/",
  body("product_id").isInt({ min: 1 }).withMessage("Invalid product ID"),
  body("store_id").isInt({ min: 1 }).withMessage("Invalid store ID"),
  body("quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be greater than 0"),
  strictLimiter,
  validate,
  authorizeRoles("salesperson", "admin"),
  createSale
);

router.get(
  "/my",
  authorizeRoles("admin", "regional_manager", "store_manager", "salesperson"),
  getMySales
);

router.get(
  "/store/:store_id",
  verifyFirebaseToken,
  authorizeRoles("admin", "regional_manager", "store_manager"),
  getStoreSales
);

module.exports = router;
