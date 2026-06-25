const WorkspaceUser = require("../models/WorkspaceUser");
const WorkspacePayment = require("../models/WorkspacePayment");
const Income = require("../models/Income");
const Setting = require("../models/Setting");
const asyncHandler = require("../utils/asyncHandler");
const { WORKSPACE_PLAN_CONFIG, DEFAULT_WORKSPACE_SLOTS } = require("../utils/constants");

const getTotalSlots = async () => {
  const setting = await Setting.findOne({ key: "workspace_total_slots" });
  return setting ? Number(setting.value) : DEFAULT_WORKSPACE_SLOTS;
};

const computeExpiry = (startDate, plan) => {
  const start = new Date(startDate);
  const { days } = WORKSPACE_PLAN_CONFIG[plan];
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
};

const getWorkspaceStats = asyncHandler(async (req, res) => {
  await WorkspaceUser.syncStatuses();

  const totalSlots = await getTotalSlots();

  const [activeCount, expiringSoonCount, expiredCount, inactiveCount, occupiedUsers] =
    await Promise.all([
      WorkspaceUser.countDocuments({ status: "Active" }),
      WorkspaceUser.countDocuments({ status: "Expiring Soon" }),
      WorkspaceUser.countDocuments({ status: "Expired" }),
      WorkspaceUser.countDocuments({ status: "Inactive" }),
      WorkspaceUser.find({ status: { $ne: "Inactive" } }).select("slotNumber"),
    ]);

  const occupiedSlotNumbers = occupiedUsers.map((u) => u.slotNumber);
  const allSlots = Array.from({ length: totalSlots }, (_, i) => i + 1);
  const availableSlotNumbers = allSlots.filter((n) => !occupiedSlotNumbers.includes(n));

  res.status(200).json({
    success: true,
    data: {
      totalSlots,
      activeCount,
      expiringSoonCount,
      expiredCount,
      inactiveCount,
      availableCount: availableSlotNumbers.length,
      occupiedSlotNumbers,
      availableSlotNumbers,
    },
  });
});

const getWorkspaceUsers = asyncHandler(async (req, res) => {
  await WorkspaceUser.syncStatuses();

  const filters = {};
  if (req.query.status && req.query.status !== "All") {
    filters.status = req.query.status;
  }
  if (req.query.search) {
    filters.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { phone: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 25));
  const skip = (page - 1) * limit;

  const [users, totalCount] = await Promise.all([
    WorkspaceUser.find(filters)
      .populate("registeredBy", "name role")
      .sort({ planExpiryDate: 1 })
      .skip(skip)
      .limit(limit),
    WorkspaceUser.countDocuments(filters),
  ]);

  res.status(200).json({
    success: true,
    count: users.length,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    page,
    data: users,
  });
});

const registerWorkspaceUser = asyncHandler(async (req, res) => {
  const { name, email, phone, slotNumber, plan, startDate, notes } = req.body;

  const totalSlots = await getTotalSlots();
  if (slotNumber > totalSlots) {
    res.status(400);
    throw new Error(`Slot #${slotNumber} exceeds the current capacity of ${totalSlots} slots.`);
  }

  const slotTaken = await WorkspaceUser.findOne({
    slotNumber,
    status: { $ne: "Inactive" },
  });
  if (slotTaken) {
    res.status(409);
    throw new Error(`Slot #${slotNumber} is already occupied by ${slotTaken.name}.`);
  }

  const start = new Date(startDate || Date.now());
  const expiry = computeExpiry(start, plan);
  const { amount } = WORKSPACE_PLAN_CONFIG[plan];

  const workspaceUser = await WorkspaceUser.create({
    name,
    email,
    phone,
    slotNumber,
    currentPlan: plan,
    planStartDate: start,
    planExpiryDate: expiry,
    status: "Active",
    notes: notes || "",
    registeredBy: req.user._id,
  });

  const income = await Income.create({
    category: "Workspace",
    amount,
    description: `Workspace fee — ${plan} plan`,
    studentName: name,
    entryDate: start,
    createdBy: req.user._id,
  });

  await WorkspacePayment.create({
    workspaceUser: workspaceUser._id,
    plan,
    amount,
    startDate: start,
    expiryDate: expiry,
    incomeRef: income._id,
    recordedBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: `${name} registered for Slot #${slotNumber} on the ${plan} plan.`,
    data: workspaceUser,
  });
});

const renewWorkspace = asyncHandler(async (req, res) => {
  const workspaceUser = await WorkspaceUser.findById(req.params.id);

  if (!workspaceUser) {
    res.status(404);
    throw new Error("Workspace user not found.");
  }
  if (workspaceUser.status === "Inactive") {
    res.status(400);
    throw new Error("Cannot renew an inactive user. Register them as a new user instead.");
  }

  const { plan, startDate } = req.body;
  const start = new Date(startDate || Date.now());
  const expiry = computeExpiry(start, plan);
  const { amount } = WORKSPACE_PLAN_CONFIG[plan];

  workspaceUser.currentPlan = plan;
  workspaceUser.planStartDate = start;
  workspaceUser.planExpiryDate = expiry;
  workspaceUser.status = "Active";
  await workspaceUser.save();

  const income = await Income.create({
    category: "Workspace",
    amount,
    description: `Workspace renewal — ${plan} plan`,
    studentName: workspaceUser.name,
    entryDate: start,
    createdBy: req.user._id,
  });

  await WorkspacePayment.create({
    workspaceUser: workspaceUser._id,
    plan,
    amount,
    startDate: start,
    expiryDate: expiry,
    incomeRef: income._id,
    recordedBy: req.user._id,
  });

  res.status(200).json({
    success: true,
    message: `Workspace renewed for ${workspaceUser.name}. New expiry: ${expiry.toDateString()}.`,
    data: workspaceUser,
  });
});

const updateWorkspaceUser = asyncHandler(async (req, res) => {
  const workspaceUser = await WorkspaceUser.findById(req.params.id);

  if (!workspaceUser) {
    res.status(404);
    throw new Error("Workspace user not found.");
  }

  const { name, email, phone, notes } = req.body;
  if (name !== undefined) workspaceUser.name = name;
  if (email !== undefined) workspaceUser.email = email;
  if (phone !== undefined) workspaceUser.phone = phone;
  if (notes !== undefined) workspaceUser.notes = notes;

  await workspaceUser.save();

  res.status(200).json({
    success: true,
    message: "User info updated.",
    data: workspaceUser,
  });
});

const deactivateWorkspaceUser = asyncHandler(async (req, res) => {
  const workspaceUser = await WorkspaceUser.findById(req.params.id);

  if (!workspaceUser) {
    res.status(404);
    throw new Error("Workspace user not found.");
  }
  if (workspaceUser.status === "Inactive") {
    res.status(400);
    throw new Error("User is already inactive.");
  }

  workspaceUser.status = "Inactive";
  workspaceUser.deactivatedAt = new Date();
  await workspaceUser.save();

  res.status(200).json({
    success: true,
    message: `${workspaceUser.name} deactivated. Slot #${workspaceUser.slotNumber} is now free.`,
    data: workspaceUser,
  });
});

const getWorkspacePayments = asyncHandler(async (req, res) => {
  const workspaceUser = await WorkspaceUser.findById(req.params.id);

  if (!workspaceUser) {
    res.status(404);
    throw new Error("Workspace user not found.");
  }

  const payments = await WorkspacePayment.find({ workspaceUser: workspaceUser._id })
    .populate("recordedBy", "name role")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: payments.length,
    data: payments,
  });
});

module.exports = {
  getWorkspaceStats,
  getWorkspaceUsers,
  registerWorkspaceUser,
  renewWorkspace,
  updateWorkspaceUser,
  deactivateWorkspaceUser,
  getWorkspacePayments,
};
