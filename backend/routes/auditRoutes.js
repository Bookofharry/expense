const express = require("express");
const { getAuditLogs } = require("../controllers/auditController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.use(adminOnly); // Strictly for Admins

router.get("/", getAuditLogs);

module.exports = router;
