const mongoose = require("mongoose");

const salaryPaymentSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: [true, "Staff member is required."],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required."],
      min: [1, "Amount must be greater than 0."],
    },
    /** Format: "YYYY-MM" — e.g. "2026-05" for May 2026 */
    payPeriod: {
      type: String,
      required: [true, "Pay period is required."],
      match: [/^\d{4}-\d{2}$/, "Pay period must be in YYYY-MM format."],
    },
    paymentDate: {
      type: Date,
      required: [true, "Payment date is required."],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [250, "Note cannot exceed 250 characters."],
      default: "",
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/** Virtual for formatted amount (used in API responses) */
salaryPaymentSchema.virtual("formattedAmount").get(function () {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(this.amount);
});

salaryPaymentSchema.set("toJSON", { virtuals: true });
salaryPaymentSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("SalaryPayment", salaryPaymentSchema);
