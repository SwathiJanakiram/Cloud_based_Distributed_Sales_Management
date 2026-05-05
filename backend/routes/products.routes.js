const express = require("express");
const router = express.Router();
const { createProduct,deleteProduct,updateProduct, getProducts, getProductsByStore} = require("../controllers/products.controller");
const { body, param, validationResult } = require("express-validator");
const AppError =require("../utils/appError");
const { verifyFirebaseToken, authorizeRoles } = 
  require("../middleware/firebaseAuth.middleware");


const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
     const messages = errors.array().map(e => e.msg).join(", ");
    return next(new AppError(messages, 400));
  }
  next();
};


router.use(verifyFirebaseToken);
router.post(
  "/",
  [body("product_name").notEmpty().withMessage("Product name required"),
  body("category").notEmpty().withMessage("Category required"),
  body("unit_price")
    .isFloat({ min: 0 })
    .withMessage("Price must be positive number"),
  ],
  validate,
  createProduct
);
router.delete(
  "/:id",
  param("id").isInt().withMessage("Valid product_id required"),
  validate,
  deleteProduct
);
router.put(
  "/:id",
  [param("id").isInt().withMessage("Valid product_id required"),
  body("product_name").notEmpty().withMessage("Product name required"),
  body("category").notEmpty().withMessage("Category required"),
  body("unit_price")
    .isFloat({ min: 0 })
    .withMessage("Price must be positive number"),
  ],
  validate,
  updateProduct
);

router.get("/", getProducts);
router.get("/getProductsByStore",getProductsByStore);

module.exports = router;
