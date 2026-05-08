const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    res.status(409);
    throw new Error("A user with this email already exists.");
  }

  const userCount = await User.countDocuments();
  const isBootstrapAdmin = userCount === 0;

  if (!isBootstrapAdmin && (!req.user || req.user.role !== "Admin")) {
    res.status(403);
    throw new Error("Only an admin can create additional staff accounts.");
  }

  const newUser = await User.create({
    name,
    email,
    password,
    role: isBootstrapAdmin ? "Admin" : role || "Clerk",
  });

  res.status(201).json({
    success: true,
    message: isBootstrapAdmin
      ? "First admin account created successfully."
      : "Staff account created successfully.",
    data: {
      user: sanitizeUser(newUser),
      token: generateToken(newUser._id),
    },
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  res.status(200).json({
    success: true,
    message: "Login successful.",
    data: {
      user: sanitizeUser(user),
      token: generateToken(user._id),
    },
  });
});

const getStaffUsers = asyncHandler(async (req, res) => {
  const staffUsers = await User.find()
    .select("-password")
    .sort({ createdAt: -1, name: 1 });

  res.status(200).json({
    success: true,
    count: staffUsers.length,
    data: staffUsers.map(sanitizeUser),
  });
});

module.exports = {
  registerUser,
  loginUser,
  getStaffUsers,
};
