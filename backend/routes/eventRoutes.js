const cors = require("cors");
const express = require("express");
const { body, param, query } = require("express-validator");

// Fully open CORS for public event routes — any client can read events and register
const openCors = cors();

const {
  getEvents,
  getEventBySlug,
  registerForEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventRegistrations,
  updateRegistrationStatus,
} = require("../controllers/eventController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validationMiddleware");
const {
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  REGISTRATION_STATUSES,
  REGISTRATION_SOURCES,
} = require("../utils/constants");

const router = express.Router();

// ─── PUBLIC ROUTES (no auth) ───────────────────────────────────────────────

router.get(
  "/",
  openCors,
  [
    query("status")
      .optional()
      .isIn([...EVENT_STATUSES, "all"])
      .withMessage("Invalid status filter."),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer."),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50."),
  ],
  validateRequest,
  getEvents
);

router.get(
  "/slug/:slug",
  openCors,
  [param("slug").trim().notEmpty().withMessage("Slug is required.")],
  validateRequest,
  getEventBySlug
);

router.post(
  "/:id/register",
  openCors,
  [
    param("id").isMongoId().withMessage("Invalid event id."),
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required.")
      .isLength({ max: 120 })
      .withMessage("Name cannot exceed 120 characters."),
    body("email").trim().isEmail().withMessage("A valid email address is required."),
    body("phone")
      .trim()
      .notEmpty()
      .withMessage("Phone number is required.")
      .isLength({ max: 20 })
      .withMessage("Phone number is too long."),
    body("source")
      .optional()
      .isIn(REGISTRATION_SOURCES)
      .withMessage(`Source must be one of: ${REGISTRATION_SOURCES.join(", ")}.`),
    body("notes")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Notes cannot exceed 500 characters."),
  ],
  validateRequest,
  registerForEvent
);

// ─── ADMIN ROUTES (protect + adminOnly) ───────────────────────────────────

// NOTE: /registrations/:regId must come before /:id to avoid route conflict
router.patch(
  "/registrations/:regId",
  protect,
  adminOnly,
  [
    param("regId").isMongoId().withMessage("Invalid registration id."),
    body("status")
      .isIn(REGISTRATION_STATUSES)
      .withMessage(`Status must be one of: ${REGISTRATION_STATUSES.join(", ")}.`),
  ],
  validateRequest,
  updateRegistrationStatus
);

router.post(
  "/",
  protect,
  adminOnly,
  [
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Event title is required.")
      .isLength({ max: 150 })
      .withMessage("Title cannot exceed 150 characters."),
    body("category")
      .isIn(EVENT_CATEGORIES)
      .withMessage(`Category must be one of: ${EVENT_CATEGORIES.join(", ")}.`),
    body("date").isISO8601().withMessage("A valid event date is required."),
    body("registrationDeadline")
      .optional()
      .isISO8601()
      .withMessage("Registration deadline must be a valid date."),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Description cannot exceed 1000 characters."),
    body("venue")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Venue cannot exceed 200 characters."),
    body("price")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative number."),
    body("capacity").optional().isInt({ min: 1 }).withMessage("Capacity must be at least 1."),
    body("status")
      .optional()
      .isIn(EVENT_STATUSES)
      .withMessage(`Status must be one of: ${EVENT_STATUSES.join(", ")}.`),
  ],
  validateRequest,
  createEvent
);

router.patch(
  "/:id",
  protect,
  adminOnly,
  [
    param("id").isMongoId().withMessage("Invalid event id."),
    body("title")
      .optional()
      .trim()
      .notEmpty()
      .isLength({ max: 150 })
      .withMessage("Title cannot exceed 150 characters."),
    body("category")
      .optional()
      .isIn(EVENT_CATEGORIES)
      .withMessage(`Category must be one of: ${EVENT_CATEGORIES.join(", ")}.`),
    body("date").optional().isISO8601().withMessage("Event date must be valid."),
    body("registrationDeadline")
      .optional()
      .isISO8601()
      .withMessage("Registration deadline must be valid."),
    body("price").optional().isFloat({ min: 0 }).withMessage("Price must be non-negative."),
    body("capacity").optional().isInt({ min: 1 }).withMessage("Capacity must be at least 1."),
    body("status")
      .optional()
      .isIn(EVENT_STATUSES)
      .withMessage(`Status must be one of: ${EVENT_STATUSES.join(", ")}.`),
  ],
  validateRequest,
  updateEvent
);

router.delete(
  "/:id",
  protect,
  adminOnly,
  [param("id").isMongoId().withMessage("Invalid event id.")],
  validateRequest,
  deleteEvent
);

router.get(
  "/:id/registrations",
  protect,
  adminOnly,
  [
    param("id").isMongoId().withMessage("Invalid event id."),
    query("status")
      .optional()
      .isIn(REGISTRATION_STATUSES)
      .withMessage("Invalid status filter."),
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer."),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100."),
  ],
  validateRequest,
  getEventRegistrations
);

module.exports = router;
