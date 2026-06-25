const USER_ROLES = ["Admin", "Clerk", "Instructor"];
const INCOME_CATEGORIES = ["Tuition", "Workspace", "ID Card", "Other"];
const BUDGET_PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const BUDGET_STATUSES = ["Pending", "Approved", "Rejected"];
const EVENT_CATEGORIES = ["Bootcamp", "Workshop", "Seminar", "Other"];
const EVENT_STATUSES = ["Upcoming", "Ongoing", "Completed", "Cancelled"];
const REGISTRATION_STATUSES = ["Pending", "Confirmed", "Attended", "Cancelled"];
const REGISTRATION_SOURCES = ["Website", "Instagram", "Referral", "Other"];
const WORKSPACE_PLANS = ["Day", "Week", "Month"];
const WORKSPACE_STATUSES = ["Active", "Expiring Soon", "Expired", "Inactive"];
const WORKSPACE_PLAN_CONFIG = {
  Day: { amount: 2000, days: 1 },
  Week: { amount: 7000, days: 7 },
  Month: { amount: 20000, days: 30 },
};

// Default seed value — the live value lives in the Setting collection
const DEFAULT_WORKSPACE_SLOTS = 7;

module.exports = {
  USER_ROLES,
  INCOME_CATEGORIES,
  BUDGET_PRIORITIES,
  BUDGET_STATUSES,
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  REGISTRATION_STATUSES,
  REGISTRATION_SOURCES,
  WORKSPACE_PLANS,
  WORKSPACE_STATUSES,
  WORKSPACE_PLAN_CONFIG,
  DEFAULT_WORKSPACE_SLOTS,
};
