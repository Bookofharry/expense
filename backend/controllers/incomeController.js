const Income = require("../models/Income");
const asyncHandler = require("../utils/asyncHandler");
const { logAuditAction } = require("../utils/auditLogger");

const buildIncomeFilters = (query) => {
  const filters = {};

  if (query.category) {
    filters.category = query.category;
  }

  if (query.createdBy) {
    filters.createdBy = query.createdBy;
  }

  if (query.startDate || query.endDate) {
    filters.entryDate = {};

    if (query.startDate) {
      filters.entryDate.$gte = new Date(query.startDate);
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
      filters.entryDate.$lte = endDate;
    }
  }

  return filters;
};

const createIncome = asyncHandler(async (req, res) => {
  if (req.user.role === "Admin") {
    res.status(403);
    throw new Error("Admins cannot log income entries.");
  }

  const income = await Income.create({
    ...req.body,
    createdBy: req.user._id,
  });

  const populatedIncome = await Income.findById(income._id).populate("createdBy", "name email role");

  await logAuditAction({
    req,
    action: "INCOME_LOGGED",
    targetModel: "Income",
    targetId: income._id,
    payload: {
      amount: income.amount,
      category: income.category,
    },
  });

  res.status(201).json({
    success: true,
    message: "Income logged successfully.",
    data: populatedIncome,
  });
});

const getIncomes = asyncHandler(async (req, res) => {
  const filters = buildIncomeFilters(req.query);

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
  const skip = (page - 1) * limit;

  const [incomes, totalCount] = await Promise.all([
    Income.find(filters)
      .populate("createdBy", "name email role")
      .sort({ entryDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Income.countDocuments(filters),
  ]);

  res.status(200).json({
    success: true,
    count: incomes.length,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    page,
    data: incomes,
  });
});

const getIncomeById = asyncHandler(async (req, res) => {
  const income = await Income.findById(req.params.id).populate("createdBy", "name email role");

  if (!income) {
    res.status(404);
    throw new Error("Income record not found.");
  }

  res.status(200).json({
    success: true,
    data: income,
  });
});

const updateIncome = asyncHandler(async (req, res) => {
  const income = await Income.findById(req.params.id);

  if (!income) {
    res.status(404);
    throw new Error("Income record not found.");
  }

  const isOwner = income.createdBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "Admin") {
    res.status(403);
    throw new Error("You can only update your own income entries.");
  }

  Object.assign(income, req.body);
  await income.save();

  const updatedIncome = await Income.findById(income._id).populate("createdBy", "name email role");

  res.status(200).json({
    success: true,
    message: "Income record updated successfully.",
    data: updatedIncome,
  });
});

const deleteIncome = asyncHandler(async (req, res) => {
  const income = await Income.findById(req.params.id);

  if (!income) {
    res.status(404);
    throw new Error("Income record not found.");
  }

  const isOwner = income.createdBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "Admin") {
    res.status(403);
    throw new Error("You can only delete your own income entries.");
  }

  await income.deleteOne();

  res.status(200).json({
    success: true,
    message: "Income record deleted successfully.",
  });
});

module.exports = {
  createIncome,
  getIncomes,
  getIncomeById,
  updateIncome,
  deleteIncome,
};
