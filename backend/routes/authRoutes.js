const express = require("express");
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");

const { registerUser, loginUser, getStaffUsers } = require("../controllers/authController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validationMiddleware");
const { USER_ROLES } = require("../utils/constants");

const router = express.Router();

/** Allow max 10 login attempts per IP per 15 minutes */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many login attempts. Please try again in 15 minutes.",
    });
  },
});

router.post(
  "/register",
  (req, res, next) => {
    if (req.headers.authorization) {
      return protect(req, res, next);
    }

    return next();
  },
  (req, res, next) => {
    if (req.headers.authorization) {
      return adminOnly(req, res, next);
    }

    return next();
  },
  [
    body("name").trim().notEmpty().withMessage("Name is required.").isLength({ min: 2 }),
    body("email").trim().isEmail().withMessage("Valid email is required.").normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters."),
    body("role")
      .optional()
      .isIn(USER_ROLES)
      .withMessage(`Role must be one of: ${USER_ROLES.join(", ")}.`),
  ],
  validateRequest,
  registerUser
);

router.post(
  "/login",
  loginLimiter,
  [
    body("email").trim().isEmail().withMessage("Valid email is required.").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  validateRequest,
  loginUser
);

router.get("/staff", protect, adminOnly, getStaffUsers);

module.exports = router;
