const express = require("express");
const router = express.Router();
const { createProduct, getProducts } = require("../controllers/products.controller");
const { body, validationResult } = require("express-validator");
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
  body("product_name").notEmpty().withMessage("Product name required"),
  body("category").notEmpty().withMessage("Category required"),
  body("unit_price")
    .isFloat({ min: 0 })
    .withMessage("Price must be positive number"),
  validate,
  createProduct
);


router.get("/", getProducts);

module.exports = router;
