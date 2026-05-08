const mongoose = require("mongoose");

const { BUDGET_PRIORITIES, BUDGET_STATUSES } = require("../utils/constants");
const { formatNaira } = require("../utils/formatters");

const budgetDemandSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Budget title is required."],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters."],
    },
    amount: {
      type: Number,
      required: [true, "Budget amount is required."],
      min: [0, "Amount cannot be negative."],
    },
    justification: {
      type: String,
      required: [true, "Justification is required."],
      trim: true,
      maxlength: [500, "Justification cannot exceed 500 characters."],
    },
    priority: {
      type: String,
      enum: BUDGET_PRIORITIES,
      default: "Medium",
    },
    status: {
      type: String,
      enum: BUDGET_STATUSES,
      default: "Pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNote: {
      type: String,
      trim: true,
      maxlength: [250, "Review note cannot exceed 250 characters."],
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

budgetDemandSchema.virtual("formattedAmount").get(function getFormattedAmount() {
  return formatNaira(this.amount);
});

module.exports = mongoose.model("BudgetDemand", budgetDemandSchema);
