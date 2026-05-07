const express = require("express");
const router = express.Router();
const {
  authorizeRoles,
  verifyFirebaseToken,
} = require("../middleware/firebaseAuth.middleware");
const {
  getAssignments,
  createAssignment,
  deleteAssignment,
} = require("../controllers/assignmnet.controller");

const { body,param, validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

router.use(verifyFirebaseToken);

router.get(
  "/:user_id",
  param("user_id").isInt().withMessage("User Id Required"),
  validate,
  authorizeRoles("admin"),
  getAssignments,
);
router.post(
  "/",
  body("user_id").isInt().withMessage("User Id required."),
  body("location_id").isInt().withMessage("Location Id required."),
  body("location_type").notEmpty().withMessage("Location type required."),
  validate,
  authorizeRoles("admin"),
  createAssignment,
);

router.delete(
  "/:id",
  param("id").isInt().withMessage("User Id Required"),
  validate,
  authorizeRoles("admin"),
  deleteAssignment,
);
module.exports = router;
