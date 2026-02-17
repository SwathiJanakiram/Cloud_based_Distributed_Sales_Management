const express = require("express");
const router = express.Router();
const { createStores, getStores } = require("../controllers/stores.controller");

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
  body("store_name").notEmpty().withMessage("Store name required"),
  body("city").notEmpty().withMessage("City required"),
  body("region").notEmpty().withMessage("Region required"),
  validate,
  authorizeRoles("admin"),
  createStores
);


router.get("/",authorizeRoles("admin","manager"), getStores);

module.exports = router;
