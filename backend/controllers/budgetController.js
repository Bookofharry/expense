const BudgetDemand = require("../models/BudgetDemand");
const asyncHandler = require("../utils/asyncHandler");

const createBudgetDemand = asyncHandler(async (req, res) => {
  if (req.user.role === "Admin") {
    res.status(403);
    throw new Error("Admins cannot create budget demands. They can only approve or reject them.");
  }

  const budgetDemand = await BudgetDemand.create({
    ...req.body,
    createdBy: req.user._id,
  });

  const populatedBudget = await BudgetDemand.findById(budgetDemand._id)
    .populate("createdBy", "name email role")
    .populate("reviewedBy", "name email role");

  res.status(201).json({
    success: true,
    message: "Budget demand submitted successfully.",
    data: populatedBudget,
  });
});

const getBudgetDemands = asyncHandler(async (req, res) => {
  const filters = {};

  if (req.query.status) {
    filters.status = req.query.status;
  }

  if (req.query.priority) {
    filters.priority = req.query.priority;
  }

  const budgetDemands = await BudgetDemand.find(filters)
    .populate("createdBy", "name email role")
    .populate("reviewedBy", "name email role")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: budgetDemands.length,
    data: budgetDemands,
  });
});

const reviewBudgetDemandByStatus = async (req, res, status) => {
  const budgetDemand = await BudgetDemand.findById(req.params.id);

  if (!budgetDemand) {
    res.status(404);
    throw new Error("Budget demand not found.");
  }

  if (budgetDemand.status !== "Pending") {
    res.status(400);
    throw new Error("Only pending budget demands can be reviewed.");
  }

  budgetDemand.status = status;
  budgetDemand.reviewedBy = req.user._id;
  budgetDemand.reviewedAt = new Date();
  budgetDemand.reviewNote = req.body.reviewNote || "";

  await budgetDemand.save();

  const reviewedBudget = await BudgetDemand.findById(budgetDemand._id)
    .populate("createdBy", "name email role")
    .populate("reviewedBy", "name email role");

  res.status(200).json({
    success: true,
    message: `Budget demand ${status.toLowerCase()} successfully.`,
    data: reviewedBudget,
  });
};

const approveBudgetDemand = asyncHandler(async (req, res) => {
  await reviewBudgetDemandByStatus(req, res, "Approved");
});

const rejectBudgetDemand = asyncHandler(async (req, res) => {
  await reviewBudgetDemandByStatus(req, res, "Rejected");
});

module.exports = {
  createBudgetDemand,
  getBudgetDemands,
  approveBudgetDemand,
  rejectBudgetDemand,
};
