const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const auditRoutes = require("./routes/auditRoutes");
const salaryRoutes = require("./routes/salaryRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const eventRoutes = require("./routes/eventRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const settingRoutes = require("./routes/settingRoutes");
const Setting = require("./models/Setting");
const { DEFAULT_WORKSPACE_SLOTS } = require("./utils/constants");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();

const seedSettings = async () => {
  const defaults = [
    {
      key: "workspace_total_slots",
      value: DEFAULT_WORKSPACE_SLOTS,
      label: "Workspace Total Slots",
      description: "Maximum number of workspace slots available for rent in the hub.",
      type: "number",
    },
  ];
  for (const s of defaults) {
    await Setting.findOneAndUpdate({ key: s.key }, { $setOnInsert: s }, { upsert: true });
  }
};

connectDB().then(() => seedSettings().catch(console.error));

const app = express();

const rawOrigins = process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || "*";
const allowedOrigins =
  rawOrigins === "*" ? "*" : rawOrigins.split(",").map((o) => o.trim()).filter(Boolean);

app.use(
  cors({
    origin:
      allowedOrigins === "*"
        ? "*"
        : (origin, callback) => {
            // Allow requests with no origin (Postman, mobile apps, curl)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) return callback(null, true);
            callback(new Error(`CORS: origin ${origin} is not allowed.`));
          },
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TechMinds backend is running.",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/income", incomeRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/workspace", workspaceRoutes);
app.use("/api/settings", settingRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
