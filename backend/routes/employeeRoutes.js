const express = require("express");
const { body } = require("express-validator");

const { createEmployee, getEmployees } = require("../controllers/employeeController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validationMiddleware");

const router = express.Router();

router.use(protect, adminOnly);

router
  .route("/")
  .post(
    [
      body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required.")
        .isLength({ min: 2, max: 80 })
        .withMessage("Name must be between 2 and 80 characters."),
      body("role")
        .trim()
        .notEmpty()
        .withMessage("Role is required.")
        .isLength({ max: 50 })
        .withMessage("Role cannot exceed 50 characters."),
    ],
    validateRequest,
    createEmployee
  )
  .get(getEmployees);

module.exports = router;
