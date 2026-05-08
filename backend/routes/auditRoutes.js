const express = require("express");
const { getAuditLogs } = require("../controllers/auditController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.use(restrictTo("Admin")); // Strictly for Admins

router.get("/", getAuditLogs);

module.exports = router;
