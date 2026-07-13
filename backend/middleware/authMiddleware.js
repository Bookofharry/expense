const jwt = require("jsonwebtoken");

const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("Access denied. No token provided.");
  }

  const token = authHeader.split(" ")[1];

  // Verify signature and expiry — keep this isolated so DB errors don't get caught here
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    res.status(401);
    throw new Error(
      err.name === "TokenExpiredError"
        ? "Your session has expired. Please log in again."
        : "Invalid token. Please log in again."
    );
  }

  const user = await User.findById(decoded.userId).select("-password");
  if (!user) {
    res.status(401);
    throw new Error("Account no longer exists. Please contact an admin.");
  }

  req.user = user;
  next();
});

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "Admin") {
    res.status(403);
    throw new Error("Admin access is required for this action.");
  }

  next();
};

module.exports = {
  protect,
  adminOnly,
};
