const Employee = require("../models/Employee");
const asyncHandler = require("../utils/asyncHandler");

const createEmployee = asyncHandler(async (req, res) => {
  const { name, role } = req.body;

  const employee = await Employee.create({
    name,
    role,
  });

  res.status(201).json({
    success: true,
    message: "Employee added successfully.",
    data: employee,
  });
});

const getEmployees = asyncHandler(async (req, res) => {
  const employees = await Employee.find({ isActive: true }).sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: employees.length,
    data: employees,
  });
});

module.exports = {
  createEmployee,
  getEmployees,
};
