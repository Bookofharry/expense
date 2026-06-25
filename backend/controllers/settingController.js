const Setting = require("../models/Setting");
const asyncHandler = require("../utils/asyncHandler");

const getSettings = asyncHandler(async (req, res) => {
  const settings = await Setting.find().sort({ key: 1 });

  res.status(200).json({
    success: true,
    data: settings,
  });
});

const updateSetting = asyncHandler(async (req, res) => {
  const setting = await Setting.findOne({ key: req.params.key });

  if (!setting) {
    res.status(404);
    throw new Error("Setting not found.");
  }

  // Coerce value to the correct type
  let newValue = req.body.value;
  if (setting.type === "number") {
    newValue = Number(newValue);
    if (!Number.isFinite(newValue) || newValue < 1) {
      res.status(400);
      throw new Error("Value must be a positive number.");
    }
  }

  setting.value = newValue;
  setting.updatedBy = req.user._id;
  await setting.save();

  res.status(200).json({
    success: true,
    message: `${setting.label} updated successfully.`,
    data: setting,
  });
});

module.exports = { getSettings, updateSetting };
