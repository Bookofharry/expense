const express = require("express");
const { body, param, query } = require("express-validator");

const {
  createBudgetDemand,
  getBudgetDemands,
  approveBudgetDemand,
  rejectBudgetDemand,
} = require("../controllers/budgetController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validationMiddleware");
const { BUDGET_PRIORITIES, BUDGET_STATUSES } = require("../utils/constants");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(
    [
      body("title")
        .trim()
        .notEmpty()
        .withMessage("Budget title is required.")
        .isLength({ max: 120 })
        .withMessage("Title cannot exceed 120 characters."),
      body("amount")
        .isFloat({ gt: 0 })
        .withMessage("Amount must be a number greater than 0."),
      body("justification")
        .trim()
        .notEmpty()
        .withMessage("Justification is required.")
        .isLength({ max: 500 })
        .withMessage("Justification cannot exceed 500 characters."),
      body("priority")
        .optional()
        .isIn(BUDGET_PRIORITIES)
        .withMessage(`Priority must be one of: ${BUDGET_PRIORITIES.join(", ")}.`),
    ],
    validateRequest,
    createBudgetDemand
  )
  .get(
    [
      query("status")
        .optional()
        .isIn(BUDGET_STATUSES)
        .withMessage(`Status must be one of: ${BUDGET_STATUSES.join(", ")}.`),
      query("priority")
        .optional()
        .isIn(BUDGET_PRIORITIES)
        .withMessage(`Priority must be one of: ${BUDGET_PRIORITIES.join(", ")}.`),
      query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer."),
      query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100."),
    ],
    validateRequest,
    getBudgetDemands
  );

router.patch(
  "/:id/approve",
  protect,
  adminOnly,
  [
    param("id").isMongoId().withMessage("Invalid budget demand id."),
    body("reviewNote")
      .optional()
      .trim()
      .isLength({ max: 250 })
      .withMessage("Review note cannot exceed 250 characters."),
  ],
  validateRequest,
  approveBudgetDemand
);

router.patch(
  "/:id/reject",
  protect,
  adminOnly,
  [
    param("id").isMongoId().withMessage("Invalid budget demand id."),
    body("reviewNote")
      .optional()
      .trim()
      .isLength({ max: 250 })
      .withMessage("Review note cannot exceed 250 characters."),
  ],
  validateRequest,
  rejectBudgetDemand
);

module.exports = router;
