const express = require("express");
const router = express.Router();
const AppError =require("../utils/appError");
const {
  createStore,
  getStores,
  getStoresByRegion,
  deleteStore,
  updateStore,
} = require("../controllers/stores.controller");

const { body,param, validationResult } = require("express-validator");

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

router.post(
  "/",
  [body("store_name").notEmpty().withMessage("Store name required"),
  body("city").notEmpty().withMessage("City required"),
  body("region_id").notEmpty().withMessage("Region required"),
  body("latitude").notEmpty().withMessage("Latitude required"),
  body("longitude").notEmpty().withMessage("Longitude required"),
  ],
  validate,
  authorizeRoles("admin"),
  createStore,
);

router.delete(
  "/:id",
  param("id").isInt().withMessage("Valid store_id required"),
  validate,
  authorizeRoles("admin", "regional_manager"),
  deleteStore,
);

router.put(
  "/:id",
  [ param("id").isInt().withMessage("Valid store_id required"),
  body("city").notEmpty().withMessage("City required"),
  body("region_id").notEmpty().withMessage("Region required"),
  body("latitude").notEmpty().withMessage("Latitude required"),
  body("longitude").notEmpty().withMessage("Longitude required"),
  ],
  validate,
  authorizeRoles("admin", "regional_manager"),
  updateStore,
);
router.get("/", authorizeRoles("admin", "regional_manager"), getStores);
router.get(
  "/region/:region_id",
  authorizeRoles("admin", "regional_manager"),
  getStoresByRegion,
);

module.exports = router;
