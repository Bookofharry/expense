import type {
  ApiEnvelope,
  AppSetting,
  AuthData,
  BudgetDemand,
  BudgetPriority,
  DashboardSummary,
  IncomeCategory,
  IncomeRecord,
  PaginatedEnvelope,
  SalaryPayment,
  SalaryPageResponse,
  User,
  Employee,
  UserRole,
  AuditLog,
  TechEvent,
  EventCategory,
  EventStatus,
  EventRegistration,
  EventRegistrationsResponse,
  RegistrationStatus,
  WorkspacePlan,
  WorkspaceUser,
  WorkspacePaymentRecord,
  WorkspaceStats,
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

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

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

async function apiRequestPaginated<T>(
  path: string,
  options: RequestOptions = {}
): Promise<PaginatedEnvelope<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json().catch(() => null)) as PaginatedEnvelope<T> | null;

  if (!response.ok || !payload?.success) {
    throw new ApiError(
      (payload as unknown as ApiEnvelope<T>)?.message ?? "Request failed.",
      response.status
    );
  }

  return payload;
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

export const fetchAuditLogs = (token: string, page = 1, limit = 50) =>
  apiRequest<AuditLog[]>(`/audit?page=${page}&limit=${limit}`, { token });

export const fetchIncomes = (token: string, page = 1, limit = 25) =>
  apiRequestPaginated<IncomeRecord[]>(`/income?page=${page}&limit=${limit}`, { token });

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

export const fetchBudgetDemands = (token: string, page = 1, limit = 25) =>
  apiRequestPaginated<BudgetDemand[]>(`/budgets?page=${page}&limit=${limit}`, { token });

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

export const fetchEmployees = (token: string) => apiRequest<Employee[]>("/employees", { token });

export const createEmployee = (payload: { token: string; name: string; role: string }) =>
  apiRequest<Employee>("/employees", {
    method: "POST",
    token: payload.token,
    body: {
      name: payload.name,
      role: payload.role,
    },
  });

export const fetchSalaryPayments = (
  token: string,
  page = 1,
  limit = 25
): Promise<SalaryPageResponse> =>
  fetch(
    `${API_BASE_URL}/salary?page=${page}&limit=${limit}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  ).then(async (res) => {
    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload?.success) {
      throw new ApiError(payload?.message ?? "Request failed.", res.status);
    }
    return payload as SalaryPageResponse;
  });

export const logSalaryPaymentEntry = (payload: {
  token: string;
  staffId: string;
  amount: number;
  payPeriod: string;
  paymentDate: string;
  note?: string;
}) =>
  apiRequest<SalaryPayment>("/salary", {
    method: "POST",
    token: payload.token,
    body: {
      staffId: payload.staffId,
      amount: payload.amount,
      payPeriod: payload.payPeriod,
      paymentDate: payload.paymentDate,
      note: payload.note,
    },
  });

// ─── Events ───────────────────────────────────────────────────────────────

export const fetchAllEvents = (token: string, page = 1, limit = 20) =>
  apiRequestPaginated<TechEvent[]>(`/events?status=all&page=${page}&limit=${limit}`, { token });

export const createEvent = (payload: {
  token: string;
  title: string;
  category: EventCategory;
  date: string;
  registrationDeadline?: string;
  venue?: string;
  description?: string;
  price?: number;
  capacity?: number;
  status?: EventStatus;
}) =>
  apiRequest<TechEvent>("/events", {
    method: "POST",
    token: payload.token,
    body: {
      title: payload.title,
      category: payload.category,
      date: payload.date,
      registrationDeadline: payload.registrationDeadline,
      venue: payload.venue,
      description: payload.description,
      price: payload.price,
      capacity: payload.capacity,
      status: payload.status,
    },
  });

export const updateEvent = (payload: {
  token: string;
  id: string;
  title?: string;
  category?: EventCategory;
  date?: string;
  registrationDeadline?: string;
  venue?: string;
  description?: string;
  price?: number;
  capacity?: number;
  status?: EventStatus;
}) =>
  apiRequest<TechEvent>(`/events/${payload.id}`, {
    method: "PATCH",
    token: payload.token,
    body: {
      title: payload.title,
      category: payload.category,
      date: payload.date,
      registrationDeadline: payload.registrationDeadline,
      venue: payload.venue,
      description: payload.description,
      price: payload.price,
      capacity: payload.capacity,
      status: payload.status,
    },
  });

export const deleteEvent = (token: string, id: string) =>
  apiRequest<void>(`/events/${id}`, { method: "DELETE", token });

export const fetchEventRegistrations = (
  token: string,
  eventId: string,
  page = 1,
  limit = 25
): Promise<EventRegistrationsResponse> =>
  fetch(`${API_BASE_URL}/events/${eventId}/registrations?page=${page}&limit=${limit}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  }).then(async (res) => {
    const payload = await res.json().catch(() => null);
    if (!res.ok || !payload?.success) {
      throw new ApiError(payload?.message ?? "Request failed.", res.status);
    }
    return payload as EventRegistrationsResponse;
  });

export const updateRegistrationStatus = (
  token: string,
  regId: string,
  status: RegistrationStatus
) =>
  apiRequest<EventRegistration>(`/events/registrations/${regId}`, {
    method: "PATCH",
    token,
    body: { status },
  });

// ─── Workspace ────────────────────────────────────────────────────────────────

export const fetchWorkspaceStats = (token: string) =>
  apiRequest<WorkspaceStats>("/workspace/stats", { token });

export const fetchWorkspaceUsers = (
  token: string,
  page = 1,
  limit = 25,
  status = "All",
  search = ""
) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status && status !== "All") params.set("status", status);
  if (search.trim()) params.set("search", search.trim());
  return apiRequestPaginated<WorkspaceUser[]>(`/workspace?${params.toString()}`, { token });
};

export const registerWorkspaceUser = (payload: {
  token: string;
  name: string;
  email: string;
  phone: string;
  slotNumber: number;
  plan: WorkspacePlan;
  startDate?: string;
  notes?: string;
}) =>
  apiRequest<WorkspaceUser>("/workspace", {
    method: "POST",
    token: payload.token,
    body: {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      slotNumber: payload.slotNumber,
      plan: payload.plan,
      startDate: payload.startDate,
      notes: payload.notes,
    },
  });

export const renewWorkspaceUser = (payload: {
  token: string;
  id: string;
  plan: WorkspacePlan;
  startDate?: string;
}) =>
  apiRequest<WorkspaceUser>(`/workspace/${payload.id}/renew`, {
    method: "POST",
    token: payload.token,
    body: { plan: payload.plan, startDate: payload.startDate },
  });

export const updateWorkspaceUserInfo = (payload: {
  token: string;
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
}) =>
  apiRequest<WorkspaceUser>(`/workspace/${payload.id}`, {
    method: "PATCH",
    token: payload.token,
    body: { name: payload.name, email: payload.email, phone: payload.phone, notes: payload.notes },
  });

export const deactivateWorkspaceUser = (token: string, id: string) =>
  apiRequest<WorkspaceUser>(`/workspace/${id}/deactivate`, { method: "PATCH", token });

export const fetchWorkspacePayments = (token: string, userId: string) =>
  apiRequest<WorkspacePaymentRecord[]>(`/workspace/${userId}/payments`, { token });

// ─── Settings ─────────────────────────────────────────────────────────────────

export const fetchSettings = (token: string) =>
  apiRequest<AppSetting[]>("/settings", { token });

export const updateSetting = (token: string, key: string, value: number | string | boolean) =>
  apiRequest<AppSetting>(`/settings/${key}`, {
    method: "PATCH",
    token,
    body: { value },
  });
