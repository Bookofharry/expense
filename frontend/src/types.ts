export type UserRole = "Admin" | "Clerk" | "Instructor";
export type IncomeCategory = "Tuition" | "Workspace" | "ID Card" | "Other";
export type BudgetPriority = "Low" | "Medium" | "High" | "Urgent";
export type BudgetStatus = "Pending" | "Approved" | "Rejected";
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
  totalSalaryPaidThisMonth: number;
  currentCashPosition: number;
  allTimeIncome: number;
  allTimeApprovedExpenditure: number;
  allTimeSalaryPaid: number;
  formatted: {
    totalIncomeThisMonth: string;
    totalPendingBudgetDemands: string;
    totalApprovedExpenditureThisMonth: string;
    totalSalaryPaidThisMonth: string;
    currentCashPosition: string;
    allTimeIncome: string;
    allTimeApprovedExpenditure: string;
    allTimeSalaryPaid: string;
  };
}

export interface DashboardSummary {
  statusBanner: StatusBanner;
  financialSnapshot: FinancialSnapshot;
  activityFeed: ActivityItem[];
}

export interface Employee {
  _id: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface SalaryPayment {
  _id: string;
  staff: Employee;
  amount: number;
  formattedAmount: string;
  payPeriod: string;
  paymentDate: string;
  note: string;
  paidBy: UserReference;
  createdAt: string;
}

export interface SalaryPageResponse {
  success: boolean;
  count: number;
  totalCount: number;
  totalPages: number;
  page: number;
  summary: {
    allTimeSalary: number;
    thisMonthSalary: number;
    formatted: {
      allTimeSalary: string;
      thisMonthSalary: string;
    };
  };
  data: SalaryPayment[];
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

export type EventCategory = "Bootcamp" | "Workshop" | "Seminar" | "Other";
export type EventStatus = "Upcoming" | "Ongoing" | "Completed" | "Cancelled";
export type RegistrationStatus = "Pending" | "Confirmed" | "Attended" | "Cancelled";
export type RegistrationSource = "Website" | "Instagram" | "Referral" | "Other";

export interface TechEvent {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: EventCategory;
  date: string;
  registrationDeadline?: string;
  venue: string;
  price: number;
  capacity?: number;
  status: EventStatus;
  createdAt: string;
}

export interface EventRegistration {
  _id: string;
  event: string;
  name: string;
  email: string;
  phone: string;
  source: RegistrationSource;
  notes: string;
  status: RegistrationStatus;
  createdAt: string;
}

export interface EventRegistrationsResponse {
  success: boolean;
  count: number;
  totalCount: number;
  totalPages: number;
  page: number;
  eventTitle: string;
  data: EventRegistration[];
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  count?: number;
  data: T;
}

export interface PaginatedEnvelope<T> {
  success: boolean;
  message?: string;
  count: number;
  totalCount: number;
  totalPages: number;
  page: number;
  data: T;
}
