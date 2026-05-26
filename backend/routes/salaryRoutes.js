const express = require("express");
const { body, query } = require("express-validator");

const { logSalaryPayment, getSalaryPayments } = require("../controllers/salaryController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validationMiddleware");

const router = express.Router();

router.use(protect, adminOnly);

router
  .route("/")
  .post(
    [
      body("staffId").isMongoId().withMessage("A valid staff member is required."),
      body("amount")
        .isFloat({ gt: 0 })
        .withMessage("Amount must be a number greater than 0."),
      body("payPeriod")
        .matches(/^\d{4}-\d{2}$/)
        .withMessage("Pay period must be in YYYY-MM format (e.g. 2026-05)."),
      body("paymentDate").isISO8601().withMessage("Payment date must be a valid date."),
      body("note")
        .optional()
        .trim()
        .isLength({ max: 250 })
        .withMessage("Note cannot exceed 250 characters."),
    ],
    validateRequest,
    logSalaryPayment
  )
  .get(
    [
      query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer."),
      query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100."),
      query("staffId").optional().isMongoId().withMessage("staffId must be a valid ID."),
      query("payPeriod")
        .optional()
        .matches(/^\d{4}-\d{2}$/)
        .withMessage("payPeriod must be in YYYY-MM format."),
    ],
    validateRequest,
    getSalaryPayments
  );

module.exports = router;
