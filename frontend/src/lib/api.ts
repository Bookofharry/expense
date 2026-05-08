import type {
  ApiEnvelope,
  AuthData,
  BudgetDemand,
  BudgetPriority,
  DashboardSummary,
  IncomeCategory,
  IncomeRecord,
  User,
  UserRole,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type HttpMethod = "GET" | "POST" | "PATCH";

interface RequestOptions {
  method?: HttpMethod;
  token?: string;
  body?: Record<string, unknown>;
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.success) {
    throw new ApiError(payload?.message ?? "Request failed.", response.status);
  }

  return payload.data;
}

export const loginUser = (email: string, password: string) =>
  apiRequest<AuthData>("/auth/login", {
    method: "POST",
    body: { email, password },
  });

export const registerBootstrapUser = (payload: {
  name: string;
  email: string;
  password: string;
}) =>
  apiRequest<AuthData>("/auth/register", {
    method: "POST",
    body: payload,
  });

export const createStaffUser = (payload: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  token: string;
}) =>
  apiRequest<AuthData>("/auth/register", {
    method: "POST",
    token: payload.token,
    body: {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role,
    },
  });

export const fetchDashboardSummary = (token: string) =>
  apiRequest<DashboardSummary>("/dashboard/summary", { token });

export const fetchIncomes = (token: string) => apiRequest<IncomeRecord[]>("/income", { token });

export const createIncomeEntry = (payload: {
  token: string;
  category: IncomeCategory;
  amount: number;
  description?: string;
  studentName?: string;
  entryDate?: string;
}) =>
  apiRequest<IncomeRecord>("/income", {
    method: "POST",
    token: payload.token,
    body: {
      category: payload.category,
      amount: payload.amount,
      description: payload.description,
      studentName: payload.studentName,
      entryDate: payload.entryDate,
    },
  });

export const fetchBudgetDemands = (token: string) =>
  apiRequest<BudgetDemand[]>("/budgets", { token });

export const createBudgetDemandEntry = (payload: {
  token: string;
  title: string;
  amount: number;
  justification: string;
  priority: BudgetPriority;
}) =>
  apiRequest<BudgetDemand>("/budgets", {
    method: "POST",
    token: payload.token,
    body: {
      title: payload.title,
      amount: payload.amount,
      justification: payload.justification,
      priority: payload.priority,
    },
  });

export const approveBudgetDemandEntry = (payload: {
  token: string;
  id: string;
  reviewNote?: string;
}) =>
  apiRequest<BudgetDemand>(`/budgets/${payload.id}/approve`, {
    method: "PATCH",
    token: payload.token,
    body: {
      reviewNote: payload.reviewNote,
    },
  });

export const rejectBudgetDemandEntry = (payload: {
  token: string;
  id: string;
  reviewNote?: string;
}) =>
  apiRequest<BudgetDemand>(`/budgets/${payload.id}/reject`, {
    method: "PATCH",
    token: payload.token,
    body: {
      reviewNote: payload.reviewNote,
    },
  });

export const fetchStaffUsers = (token: string) => apiRequest<User[]>("/auth/staff", { token });
