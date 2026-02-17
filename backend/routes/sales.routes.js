const express = require("express");
const router = express.Router();
const { createSale } = require("../controllers/sales.controller");
const { body, validationResult } = require("express-validator");
const { strictLimiter } = require("../middleware/rateLimit.middleware");


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

router.post(
  "/",
  body("product_id").isInt({ min: 1 }).withMessage("Invalid product ID"),
  body("store_id").isInt({ min: 1 }).withMessage("Invalid store ID"),
  body("user_id").isInt({ min: 1 }).withMessage("Invalid user ID"),
  body("quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be greater than 0"),
  strictLimiter,
  validate,
  createSale
);


module.exports = router;
