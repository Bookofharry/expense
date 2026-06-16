const mongoose = require("mongoose");

const { REGISTRATION_STATUSES, REGISTRATION_SOURCES } = require("../utils/constants");

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event reference is required."],
    },
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
      required: [true, "Phone number is required."],
      trim: true,
      maxlength: [20, "Phone number cannot exceed 20 characters."],
    },
    source: {
      type: String,
      enum: REGISTRATION_SOURCES,
      default: "Website",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters."],
      default: "",
    },
    status: {
      type: String,
      enum: REGISTRATION_STATUSES,
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the same email from registering for the same event twice
registrationSchema.index({ event: 1, email: 1 }, { unique: true });

module.exports = mongoose.model("EventRegistration", registrationSchema);
