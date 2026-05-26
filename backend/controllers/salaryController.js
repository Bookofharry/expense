const SalaryPayment = require("../models/SalaryPayment");
const asyncHandler = require("../utils/asyncHandler");
const { logAuditAction } = require("../utils/auditLogger");
const { formatNaira } = require("../utils/formatters");

const logSalaryPayment = asyncHandler(async (req, res) => {
  const { staffId, amount, payPeriod, paymentDate, note } = req.body;

  const payment = await SalaryPayment.create({
    staff: staffId,
    amount,
    payPeriod,
    paymentDate,
    note: note || "",
    paidBy: req.user._id,
  });

  const populated = await SalaryPayment.findById(payment._id)
    .populate("staff", "name role")
    .populate("paidBy", "name role");

  await logAuditAction({
    req,
    action: "SALARY_LOGGED",
    targetModel: "SalaryPayment",
    targetId: payment._id,
    payload: {
      staff: populated.staff?.name,
      amount: payment.amount,
      payPeriod: payment.payPeriod,
    },
  });

  res.status(201).json({
    success: true,
    message: `Salary payment logged for ${populated.staff?.name} (${payPeriod}).`,
    data: populated,
  });
});

const getSalaryPayments = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
  const skip = (page - 1) * limit;

  const filters = {};
  if (req.query.staffId) filters.staff = req.query.staffId;
  if (req.query.payPeriod) filters.payPeriod = req.query.payPeriod;

  const [payments, totalCount] = await Promise.all([
    SalaryPayment.find(filters)
      .populate("staff", "name role")
      .populate("paidBy", "name role")
      .sort({ paymentDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SalaryPayment.countDocuments(filters),
  ]);

  // Attach totalSalaryAllTime and thisMonth for convenience
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [allTimeResult, thisMonthResult] = await Promise.all([
    SalaryPayment.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
    SalaryPayment.aggregate([
      { $match: { payPeriod: currentPeriod } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const allTimeSalary = allTimeResult[0]?.total || 0;
  const thisMonthSalary = thisMonthResult[0]?.total || 0;

  res.status(200).json({
    success: true,
    count: payments.length,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    page,
    summary: {
      allTimeSalary,
      thisMonthSalary,
      formatted: {
        allTimeSalary: formatNaira(allTimeSalary),
        thisMonthSalary: formatNaira(thisMonthSalary),
      },
    },
    data: payments,
  });
});

module.exports = {
  logSalaryPayment,
  getSalaryPayments,
};
