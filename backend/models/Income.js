const mongoose = require("mongoose");

const { INCOME_CATEGORIES } = require("../utils/constants");
const { formatNaira } = require("../utils/formatters");

const incomeSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, "Income category is required."],
      enum: INCOME_CATEGORIES,
    },
    amount: {
      type: Number,
      required: [true, "Income amount is required."],
      min: [0, "Amount cannot be negative."],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [250, "Description cannot exceed 250 characters."],
      default: "",
    },
    studentName: {
      type: String,
      trim: true,
      maxlength: [120, "Student name cannot exceed 120 characters."],
      default: "",
    },
    entryDate: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

incomeSchema.virtual("formattedAmount").get(function getFormattedAmount() {
  return formatNaira(this.amount);
});

module.exports = mongoose.model("Income", incomeSchema);
