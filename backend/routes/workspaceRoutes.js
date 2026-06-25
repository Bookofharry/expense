const express = require("express");
const { body, param, query } = require("express-validator");

const {
  getWorkspaceStats,
  getWorkspaceUsers,
  registerWorkspaceUser,
  renewWorkspace,
  updateWorkspaceUser,
  deactivateWorkspaceUser,
  getWorkspacePayments,
} = require("../controllers/workspaceController");
const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validationMiddleware");
const { WORKSPACE_PLANS, WORKSPACE_STATUSES } = require("../utils/constants");

const router = express.Router();

// All workspace routes require authentication (Clerk + Admin)
router.use(protect);

router.get("/stats", getWorkspaceStats);

router
  .route("/")
  .get(
    [
      query("status")
        .optional()
        .isIn([...WORKSPACE_STATUSES, "All"])
        .withMessage("Invalid status filter."),
      query("search").optional().trim().isLength({ max: 100 }),
      query("page").optional().isInt({ min: 1 }),
      query("limit").optional().isInt({ min: 1, max: 50 }),
    ],
    validateRequest,
    getWorkspaceUsers
  )
  .post(
    [
      body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required.")
        .isLength({ max: 120 }),
      body("email").trim().isEmail().withMessage("Valid email is required."),
      body("phone")
        .trim()
        .notEmpty()
        .withMessage("Phone is required.")
        .isLength({ max: 20 }),
      body("slotNumber")
        .isInt({ min: 1 })
        .withMessage("Slot number must be a positive integer."),
      body("plan")
        .isIn(WORKSPACE_PLANS)
        .withMessage(`Plan must be one of: ${WORKSPACE_PLANS.join(", ")}.`),
      body("startDate").optional().isISO8601().withMessage("Start date must be a valid date."),
      body("notes").optional().trim().isLength({ max: 300 }),
    ],
    validateRequest,
    registerWorkspaceUser
  );

// IMPORTANT: specific sub-routes must come before /:id to avoid conflicts
router.get(
  "/:id/payments",
  [param("id").isMongoId().withMessage("Invalid user id.")],
  validateRequest,
  getWorkspacePayments
);

router.post(
  "/:id/renew",
  [
    param("id").isMongoId().withMessage("Invalid user id."),
    body("plan")
      .isIn(WORKSPACE_PLANS)
      .withMessage(`Plan must be one of: ${WORKSPACE_PLANS.join(", ")}.`),
    body("startDate").optional().isISO8601().withMessage("Start date must be a valid date."),
  ],
  validateRequest,
  renewWorkspace
);

router.patch(
  "/:id/deactivate",
  [param("id").isMongoId().withMessage("Invalid user id.")],
  validateRequest,
  deactivateWorkspaceUser
);

router.patch(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid user id."),
    body("name").optional().trim().notEmpty().isLength({ max: 120 }),
    body("email").optional().trim().isEmail().withMessage("Valid email required."),
    body("phone").optional().trim().isLength({ max: 20 }),
    body("notes").optional().trim().isLength({ max: 300 }),
  ],
  validateRequest,
  updateWorkspaceUser
);

module.exports = router;
