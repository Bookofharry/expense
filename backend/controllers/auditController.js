const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../utils/asyncHandler");

const getAuditLogs = asyncHandler(async (req, res) => {
  // Only Admin can view audit logs, handled by middleware
  
  const filters = {};
  if (req.query.action) {
    filters.action = req.query.action;
  }
  if (req.query.userId) {
    filters.actor = req.query.userId;
  }

  // Pagination support
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const total = await AuditLog.countDocuments(filters);

  const logs = await AuditLog.find(filters)
    .populate("actor", "name email role")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    count: logs.length,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
    },
    data: logs,
  });
});

module.exports = { getAuditLogs };
