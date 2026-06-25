const mongoose = require("mongoose");

const { WORKSPACE_PLANS, WORKSPACE_STATUSES } = require("../utils/constants");

const workspaceUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      maxlength: [120, "Name cannot exceed 120 characters."],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address."],
    },
    phone: {
      type: String,
      required: [true, "Phone is required."],
      trim: true,
      maxlength: [20, "Phone cannot exceed 20 characters."],
    },
    slotNumber: {
      type: Number,
      required: [true, "Slot number is required."],
      min: [1, "Slot number must be at least 1."],
    },
    status: {
      type: String,
      enum: WORKSPACE_STATUSES,
      default: "Active",
    },
    currentPlan: {
      type: String,
      enum: WORKSPACE_PLANS,
      required: true,
    },
    planStartDate: {
      type: Date,
      required: true,
    },
    planExpiryDate: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, "Notes cannot exceed 300 characters."],
      default: "",
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deactivatedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Prevent two non-inactive users from occupying the same slot
workspaceUserSchema.index(
  { slotNumber: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: "Inactive" } } }
);

workspaceUserSchema.statics.syncStatuses = async function () {
  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  await Promise.all([
    // Active → Expiring Soon (within 2 days of expiry)
    this.updateMany(
      { status: "Active", planExpiryDate: { $lte: twoDaysFromNow, $gt: now } },
      { $set: { status: "Expiring Soon" } }
    ),
    // Active / Expiring Soon → Expired
    this.updateMany(
      { status: { $in: ["Active", "Expiring Soon"] }, planExpiryDate: { $lte: now } },
      { $set: { status: "Expired" } }
    ),
    // Expired → Inactive after 7-day grace period (slot freed automatically)
    this.updateMany(
      { status: "Expired", planExpiryDate: { $lte: sevenDaysAgo } },
      { $set: { status: "Inactive", deactivatedAt: now } }
    ),
  ]);
};

module.exports = mongoose.model("WorkspaceUser", workspaceUserSchema);
