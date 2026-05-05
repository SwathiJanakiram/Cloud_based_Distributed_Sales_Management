const express = require("express");
const router = express.Router();
const {
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getWarehouse,
} = require("../controllers/warehouses.controller");
const { body, param,validationResult } = require("express-validator");
const AppError = require("../utils/appError")

const {
  verifyFirebaseToken,
  authorizeRoles,
} = require("../middleware/firebaseAuth.middleware");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg).join(", ");
    return next(new AppError(messages, 400));
  }
  next();
};
 
router.use(verifyFirebaseToken);

router.get("/", authorizeRoles("admin"), getWarehouse);
router.post(
  "/",
  [
    body("warehouse_name").notEmpty().withMessage("Name is required"),
    body("region_id").isInt().withMessage("Valid Region ID required"),
    body("address").notEmpty().withMessage("Address required"),
    body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90"),
    body("longitude").isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180"),
  ],
  validate,
  authorizeRoles("admin"),
  createWarehouse,
);

router.put(
  "/:id",
  [param("id").isInt().withMessage("Valid warehouse ID required"),
  body("warehouse_name").notEmpty().withMessage("Name is required"),
  body("region_id").isInt().withMessage("Valid Region ID required"),
  body("address").notEmpty().withMessage("Address required"),
  body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90"),,
  body("longitude").isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180"),
],
  validate,
  authorizeRoles("admin"),
  updateWarehouse,
);
router.delete(
  "/:id",
  param("id").isInt().withMessage("Valid warehouse Id required"),
  validate,
  authorizeRoles("admin"),
  deleteWarehouse,
);

module.exports = router;
