const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "USER_LOGIN",
        "USER_REGISTERED",
        "INCOME_LOGGED",
        "BUDGET_CREATED",
        "BUDGET_APPROVED",
        "BUDGET_REJECTED",
      ],
    },
    targetModel: {
      type: String,
      required: false,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
    ipAddress: {
      type: String,
      required: false,
    },
    userAgent: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    capped: { size: 1024 * 1024 * 50, max: 100000 }, // 50MB max or 100,000 logs
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
