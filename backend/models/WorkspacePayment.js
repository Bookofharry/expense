const mongoose = require("mongoose");

const { WORKSPACE_PLANS } = require("../utils/constants");

const workspacePaymentSchema = new mongoose.Schema(
  {
    workspaceUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkspaceUser",
      required: true,
    },
    plan: {
      type: String,
      enum: WORKSPACE_PLANS,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    incomeRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Income",
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkspacePayment", workspacePaymentSchema);
