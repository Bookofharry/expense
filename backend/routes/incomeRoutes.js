const express = require("express");
const { body, param, query } = require("express-validator");

const {
  createIncome,
  getIncomes,
  getIncomeById,
  updateIncome,
  deleteIncome,
} = require("../controllers/incomeController");
const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validationMiddleware");
const { INCOME_CATEGORIES } = require("../utils/constants");

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(
    [
      body("category")
        .isIn(INCOME_CATEGORIES)
        .withMessage(`Category must be one of: ${INCOME_CATEGORIES.join(", ")}.`),
      body("amount")
        .isFloat({ gt: 0 })
        .withMessage("Amount must be a number greater than 0."),
      body("description")
        .optional()
        .trim()
        .isLength({ max: 250 })
        .withMessage("Description cannot exceed 250 characters."),
      body("studentName")
        .optional()
        .trim()
        .isLength({ max: 120 })
        .withMessage("Student name cannot exceed 120 characters."),
      body("entryDate").optional().isISO8601().withMessage("Entry date must be a valid date."),
    ],
    validateRequest,
    createIncome
  )
  .get(
    [
      query("category")
        .optional()
        .isIn(INCOME_CATEGORIES)
        .withMessage(`Category must be one of: ${INCOME_CATEGORIES.join(", ")}.`),
      query("startDate").optional().isISO8601().withMessage("Start date must be valid."),
      query("endDate").optional().isISO8601().withMessage("End date must be valid."),
    ],
    validateRequest,
    getIncomes
  );

router
  .route("/:id")
  .get([param("id").isMongoId().withMessage("Invalid income record id.")], validateRequest, getIncomeById)
  .put(
    [
      param("id").isMongoId().withMessage("Invalid income record id."),
      body("category")
        .optional()
        .isIn(INCOME_CATEGORIES)
        .withMessage(`Category must be one of: ${INCOME_CATEGORIES.join(", ")}.`),
      body("amount")
        .optional()
        .isFloat({ gt: 0 })
        .withMessage("Amount must be a number greater than 0."),
      body("description")
        .optional()
        .trim()
        .isLength({ max: 250 })
        .withMessage("Description cannot exceed 250 characters."),
      body("studentName")
        .optional()
        .trim()
        .isLength({ max: 120 })
        .withMessage("Student name cannot exceed 120 characters."),
      body("entryDate").optional().isISO8601().withMessage("Entry date must be a valid date."),
    ],
    validateRequest,
    updateIncome
  )
  .delete(
    [param("id").isMongoId().withMessage("Invalid income record id.")],
    validateRequest,
    deleteIncome
  );

module.exports = router;
