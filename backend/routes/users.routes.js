const express = require("express");
const router = express.Router();
const { createUser,editUser, deleteUser, getUsers, getMe, getUserName, getSalespersonsByStore, updateUser } = require("../controllers/users.controller");
const { body,param, validationResult } = require("express-validator");
const { verifyFirebaseToken, authorizeRoles } = 
  require("../middleware/firebaseAuth.middleware");
const AppError = require("../utils/appError")


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
  [body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("role")
    .isIn(["admin", "store_manager", "regional_manager", "salesperson"])
    .withMessage("Invalid role"),
  body("region_id").isInt().withMessage("Region Id is required"),
  body("password")
  .isLength({ min: 8 }).withMessage("Min 8 characters")
  .matches(/[A-Z]/).withMessage("Must contain uppercase")
  .matches(/[a-z]/).withMessage("Must contain lowercase")
  .matches(/[0-9]/).withMessage("Must contain number")
  .matches(/[@$!%*?&]/).withMessage("Must contain special char"),
  ],
  validate,
  authorizeRoles("admin"),
  createUser
);

router.delete(
  "/:id",
  param("id").notEmpty().withMessage("User Id required"),
  validate,
  authorizeRoles("admin"),
  deleteUser
);

router.put(
  "/:id",
  [ param("id").notEmpty().withMessage("User Id required"),
    body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("role")
    .isIn(["admin", "store_manager", "regional_manager", "salesperson"])
    .withMessage("Invalid role"),
  body("region_id").notEmpty().withMessage("Region Id is required"),
  ],
  validate,
  authorizeRoles("admin"),
  updateUser,
)

router.get("/", authorizeRoles("admin"),getUsers);

router.get("/getUserName",authorizeRoles("admin"),getUserName);

router.get("/me", getMe);

router.get("/getSalespersonsByStore",authorizeRoles("admin", "store_manager", "regional_manager"),getSalespersonsByStore);

module.exports = router;
