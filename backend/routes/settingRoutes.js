const express = require("express");
const { body, param } = require("express-validator");

const { getSettings, updateSetting } = require("../controllers/settingController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validationMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getSettings);

router.patch(
  "/:key",
  adminOnly,
  [
    param("key").trim().notEmpty().withMessage("Setting key is required."),
    body("value").notEmpty().withMessage("Value is required."),
  ],
  validateRequest,
  updateSetting
);

module.exports = router;
