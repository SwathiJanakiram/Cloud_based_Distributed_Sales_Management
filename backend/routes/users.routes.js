const express = require("express");
const router = express.Router();
const { createUser, getUsers } = require("../controllers/users.controller");
const { body, validationResult } = require("express-validator");

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
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("role")
    .isIn(["admin", "manager", "salesperson"])
    .withMessage("Invalid role"),
  body("region").notEmpty().withMessage("Region is required"),
  validate,
  createUser
);

router.get("/", getUsers);

module.exports = router;
