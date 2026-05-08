export type UserRole = "Admin" | "Clerk" | "Instructor";
export type IncomeCategory = "Tuition" | "Workspace" | "ID Card" | "Other";
export type BudgetPriority = "Low" | "Medium" | "High" | "Urgent";
export type BudgetStatus = "Pending" | "Approved" | "Rejected";
export type AppView = "dashboard" | "income" | "budgets" | "staff";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthData {
  user: User;
  token: string;
}

export interface AuthSession extends AuthData {
  remember: boolean;
}

export interface UserReference {
  id?: string;
  _id?: string;
  name: string;
  email?: string;
  role: UserRole;
}

export interface IncomeRecord {
  _id: string;
  category: IncomeCategory;
  amount: number;
  formattedAmount: string;
  description: string;
  studentName: string;
  entryDate: string;
  createdAt: string;
  createdBy?: UserReference;
}

export interface BudgetDemand {
  _id: string;
  title: string;
  amount: number;
  formattedAmount: string;
  justification: string;
  priority: BudgetPriority;
  status: BudgetStatus;
  reviewNote: string;
  createdAt: string;
  reviewedAt: string | null;
  createdBy?: UserReference;
  reviewedBy?: UserReference | null;
}

export interface ActivityItem {
  id: string;
  type: "income" | "budget-approved";
  title: string;
  amount: number;
  formattedAmount: string;
  actor: string;
  role: string;
  timestamp: string;
  meta: {
    description?: string;
    studentName?: string;
    requestedBy?: string;
    priority?: BudgetPriority;
  };
}

export interface StatusBanner {
  label: "Optimal" | "Warning" | "Critical";
  message: string;
}

export interface FinancialSnapshot {
  totalIncomeThisMonth: number;
  totalPendingBudgetDemands: number;
  totalApprovedExpenditureThisMonth: number;
  currentCashPosition: number;
  formatted: {
    totalIncomeThisMonth: string;
    totalPendingBudgetDemands: string;
    totalApprovedExpenditureThisMonth: string;
    currentCashPosition: string;
  };
}

export interface DashboardSummary {
  statusBanner: StatusBanner;
  financialSnapshot: FinancialSnapshot;
  activityFeed: ActivityItem[];
}

export interface AuditLog {
  _id: string;
  actor: {
    _id: string;
    name: string;
    email: string;
    role: "Admin" | "Clerk" | "Instructor";
  };
  action: string;
  targetModel: string;
  targetId: string;
  payload: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  count?: number;
  data: T;
}
