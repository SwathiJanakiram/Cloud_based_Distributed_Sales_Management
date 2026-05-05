// routes/audit.routes.js
const express = require("express");
const router = express.Router();
const { getAuditLogs } = require("../controllers/audit.controller");
const { authorizeRoles,verifyFirebaseToken } = require("../middleware/firebaseAuth.middleware");

router.use(verifyFirebaseToken);
router.get(
  "/",
  authorizeRoles("admin"),
  getAuditLogs
);

module.exports = router;