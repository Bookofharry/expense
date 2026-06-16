const mongoose = require("mongoose");

const { EVENT_CATEGORIES, EVENT_STATUSES } = require("../utils/constants");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required."],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters."],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters."],
      default: "",
    },
    category: {
      type: String,
      required: [true, "Event category is required."],
      enum: EVENT_CATEGORIES,
    },
    date: {
      type: Date,
      required: [true, "Event date is required."],
    },
    registrationDeadline: {
      type: Date,
    },
    venue: {
      type: String,
      trim: true,
      maxlength: [200, "Venue cannot exceed 200 characters."],
      default: "",
    },
    price: {
      type: Number,
      min: [0, "Price cannot be negative."],
      default: 0,
    },
    capacity: {
      type: Number,
      min: [1, "Capacity must be at least 1."],
    },
    status: {
      type: String,
      enum: EVENT_STATUSES,
      default: "Upcoming",
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

// Auto-generate slug from title + short timestamp suffix to guarantee uniqueness
eventSchema.pre("save", function (next) {
  if (this.isModified("title") || this.isNew) {
    const base = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    this.slug = `${base}-${Date.now().toString(36)}`;
  }
  next();
});

// Auto-sync event statuses based on current time.
// Upcoming → Ongoing when the event start time arrives.
// Ongoing → Completed when the event's calendar day has fully passed.
// Only transitions auto-managed statuses — Cancelled is never touched.
eventSchema.statics.syncStatuses = async function () {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  await Promise.all([
    this.updateMany(
      { status: "Upcoming", date: { $lte: now } },
      { $set: { status: "Ongoing" } }
    ),
    this.updateMany(
      { status: "Ongoing", date: { $lt: startOfToday } },
      { $set: { status: "Completed" } }
    ),
  ]);
};

module.exports = mongoose.model("Event", eventSchema);
