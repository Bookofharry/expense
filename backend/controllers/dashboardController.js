const Income = require("../models/Income");
const BudgetDemand = require("../models/BudgetDemand");
const asyncHandler = require("../utils/asyncHandler");
const { formatNaira } = require("../utils/formatters");

const sumAmounts = async (Model, match) => {
  const result = await Model.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" },
      },
    },
  ]);

  return result[0]?.total || 0;
};

const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return { start, end };
};

const buildStatusBanner = ({ currentCashPosition, pendingBudgetAmount }) => {
  if (currentCashPosition <= 0 || pendingBudgetAmount > currentCashPosition) {
    return {
      label: "Critical",
      message: "Pending demands are higher than available cash. Review spending immediately.",
    };
  }

  if (pendingBudgetAmount > currentCashPosition * 0.5) {
    return {
      label: "Warning",
      message: "Cash is still positive, but pending demands are climbing fast.",
    };
  }

  return {
    label: "Optimal",
    message: "Cash flow is healthy and pending demands are within safe limits.",
  };
};

const getDashboardSummary = asyncHandler(async (req, res) => {
  const { start, end } = getMonthRange();

  const [
    totalIncomeThisMonth,
    totalApprovedExpenditureThisMonth,
    totalPendingBudgetAmount,
    allTimeIncome,
    allTimeApprovedExpenditure,
    latestIncomes,
    latestApprovedBudgets,
  ] = await Promise.all([
    sumAmounts(Income, { entryDate: { $gte: start, $lte: end } }),
    sumAmounts(BudgetDemand, {
      status: "Approved",
      reviewedAt: { $gte: start, $lte: end },
    }),
    sumAmounts(BudgetDemand, { status: "Pending" }),
    sumAmounts(Income, {}),
    sumAmounts(BudgetDemand, { status: "Approved" }),
    Income.find()
      .populate("createdBy", "name role")
      .sort({ entryDate: -1, createdAt: -1 })
      .limit(5),
    BudgetDemand.find({ status: "Approved" })
      .populate("createdBy", "name role")
      .populate("reviewedBy", "name role")
      .sort({ reviewedAt: -1, createdAt: -1 })
      .limit(5),
  ]);

  const currentCashPosition = allTimeIncome - allTimeApprovedExpenditure;
  const statusBanner = buildStatusBanner({
    currentCashPosition,
    pendingBudgetAmount: totalPendingBudgetAmount,
  });

  const activityFeed = [...latestIncomes, ...latestApprovedBudgets]
    .map((item) => {
      const isIncome = Object.prototype.hasOwnProperty.call(item.toObject(), "category");

      if (isIncome) {
        return {
          id: item._id,
          type: "income",
          title: `${item.category} income logged`,
          amount: item.amount,
          formattedAmount: item.formattedAmount,
          actor: item.createdBy?.name || "Unknown staff",
          role: item.createdBy?.role || "Unknown",
          timestamp: item.entryDate || item.createdAt,
          meta: {
            description: item.description,
            studentName: item.studentName,
          },
        };
      }

      return {
        id: item._id,
        type: "budget-approved",
        title: `${item.title} budget approved`,
        amount: item.amount,
        formattedAmount: item.formattedAmount,
        actor: item.reviewedBy?.name || "Admin",
        role: item.reviewedBy?.role || "Admin",
        timestamp: item.reviewedAt || item.updatedAt,
        meta: {
          requestedBy: item.createdBy?.name || "Unknown staff",
          priority: item.priority,
        },
      };
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  res.status(200).json({
    success: true,
    data: {
      statusBanner,
      financialSnapshot: {
        totalIncomeThisMonth,
        totalPendingBudgetDemands: totalPendingBudgetAmount,
        totalApprovedExpenditureThisMonth,
        currentCashPosition,
        formatted: {
          totalIncomeThisMonth: formatNaira(totalIncomeThisMonth),
          totalPendingBudgetDemands: formatNaira(totalPendingBudgetAmount),
          totalApprovedExpenditureThisMonth: formatNaira(totalApprovedExpenditureThisMonth),
          currentCashPosition: formatNaira(currentCashPosition),
        },
      },
      activityFeed,
    },
  });
});

module.exports = {
  getDashboardSummary,
};
