import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Banknote,
  CalendarDays,
  Coins,
  Loader2,
  MessageSquare,
  Plus,
  User,
  Users,
  XCircle,
} from "lucide-react";

import { useAuth } from "../lib/AuthContext";
import {
  fetchSalaryPayments,
  fetchEmployees,
  createEmployee,
  logSalaryPaymentEntry,
} from "../lib/api";
import { formatCurrency, formatDate } from "../lib/format";
import { EmptyState } from "./EmptyState";
import { Modal } from "./Modal";
import type { SalaryPayment, SalaryPageResponse, Employee } from "../types";

type TabView = "payments" | "employees";

export function PayrollScreen() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabView>("payments");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="section-kicker">Administration</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Payroll</h1>
        </div>
        <div className="flex rounded-lg bg-slate-900/50 p-1 ring-1 ring-white/10">
          <button
            type="button"
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === "payments"
                ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30"
                : "text-slate-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("payments")}
          >
            <Banknote className="h-4 w-4" />
            Salary Payments
          </button>
          <button
            type="button"
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === "employees"
                ? "bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30"
                : "text-slate-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("employees")}
          >
            <Users className="h-4 w-4" />
            Employees List
          </button>
        </div>
      </div>

      {activeTab === "payments" ? (
        <PaymentsTab token={token} />
      ) : (
        <EmployeesTab token={token} />
      )}
    </div>
  );
}

/* ─── Payments Tab ─────────────────────────────────────────────── */

function PaymentsTab({ token }: { token: string | null }) {
  const [response, setResponse] = useState<SalaryPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const LIMIT = 25;

  const load = useCallback(
    async (targetPage = page) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSalaryPayments(token, targetPage, LIMIT);
        setResponse(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load salary payments.");
      } finally {
        setLoading(false);
      }
    },
    [token, page]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleCreated = () => {
    setIsModalOpen(false);
    setPage(1);
    load(1);
  };

  const payments = response?.data ?? [];
  const summary = response?.summary;
  const totalPages = response?.totalPages ?? 1;
  const totalCount = response?.totalCount ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          className="primary-button"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Log Salary Payment
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="glass-subpanel p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Salary Paid (This Month)
              </p>
              <Coins className="h-5 w-5 text-amber-400" />
            </div>
            <p className="mt-3 text-2xl font-bold text-white">
              {summary.formatted.thisMonthSalary}
            </p>
          </div>
          <div className="glass-subpanel p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Total Salary Paid (All Time)
              </p>
              <Banknote className="h-5 w-5 text-rose-400" />
            </div>
            <p className="mt-3 text-2xl font-bold text-white">
              {summary.formatted.allTimeSalary}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      ) : error ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
          <XCircle className="h-10 w-10 text-rose-400" />
          <p className="text-sm text-rose-300">{error}</p>
          <button type="button" className="secondary-button" onClick={() => load()}>
            Retry
          </button>
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          title="No salary payments logged yet"
          description="Use the button above to log the first salary payment."
          icon={<Coins className="h-6 w-6 text-slate-400" />}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Staff Member</th>
                <th className="px-4 py-3">Pay Period</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="hidden px-4 py-3 md:table-cell">Payment Date</th>
                <th className="hidden px-4 py-3 lg:table-cell">Note</th>
                <th className="hidden px-4 py-3 lg:table-cell">Logged By</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment._id}
                  className="border-b border-white/5 transition hover:bg-white/[0.05]"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{payment.staff?.name || "—"}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{payment.staff?.role || ""}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                      {formatPayPeriod(payment.payPeriod)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-white">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-400 md:table-cell">
                    {formatDate(payment.paymentDate)}
                  </td>
                  <td className="hidden max-w-[180px] truncate px-4 py-3 text-slate-400 lg:table-cell">
                    {payment.note || "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-400 lg:table-cell">
                    {payment.paidBy?.name || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/8 pt-4">
          <p className="text-xs text-slate-500">
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, totalCount)} of {totalCount} payments
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="secondary-button px-3 py-2 text-xs disabled:opacity-40"
              onClick={() => {
                setPage(page - 1);
                load(page - 1);
              }}
              disabled={page <= 1 || loading}
            >
              ← Prev
            </button>
            <span className="text-xs text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="secondary-button px-3 py-2 text-xs disabled:opacity-40"
              onClick={() => {
                setPage(page + 1);
                load(page + 1);
              }}
              disabled={page >= totalPages || loading}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      <LogSalaryModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}

/** Converts "2026-05" → "May 2026" */
function formatPayPeriod(period: string): string {
  if (!period) return "—";
  const [year, month] = period.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-NG", { month: "long", year: "numeric" });
}

/* ─── Log Salary Modal ─────────────────────────────────────────── */

function LogSalaryModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { token } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const [staffId, setStaffId] = useState("");
  const [amount, setAmount] = useState("");
  const [payPeriod, setPayPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !token) return;
    setStaffLoading(true);
    fetchEmployees(token)
      .then((data) => {
        setEmployees(data);
        if (data.length > 0) setStaffId(data[0]._id);
      })
      .catch(() => {})
      .finally(() => setStaffLoading(false));
  }, [open, token]);

  const resetForm = () => {
    setAmount("");
    setNote("");
    setError(null);
    const now = new Date();
    setPayPeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    setPaymentDate(new Date().toISOString().split("T")[0]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount.replace(/,/g, ""));

    if (!staffId) {
      setError("Please select an employee.");
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (!payPeriod) {
      setError("Please select a pay period.");
      return;
    }
    if (!token) return;

    setSubmitting(true);
    setError(null);

    try {
      await logSalaryPaymentEntry({
        token,
        staffId,
        amount: numericAmount,
        payPeriod,
        paymentDate,
        note: note.trim() || undefined,
      });
      resetForm();
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log salary payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const livePreview = (() => {
    const n = Number(amount.replace(/,/g, ""));
    return Number.isFinite(n) && n > 0 ? formatCurrency(n) : "₦0";
  })();

  return (
    <Modal
      title="Log Salary Payment"
      description="Record a salary payment for an employee."
      open={open}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="salary-form"
            className="primary-button"
            disabled={submitting || staffLoading || employees.length === 0}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Logging..." : "Log Payment"}
          </button>
        </div>
      }
    >
      <form id="salary-form" className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </p>
        ) : null}

        {/* Staff member */}
        <div>
          <label className="label-text" htmlFor="salary-staff">
            <User className="mr-1 inline h-3.5 w-3.5" />
            Employee
          </label>
          {staffLoading ? (
            <div className="flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/45 px-4">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              <span className="text-sm text-slate-400">Loading employees...</span>
            </div>
          ) : employees.length === 0 ? (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              No employees found. Please add employees first.
            </div>
          ) : (
            <select
              id="salary-staff"
              className="input-field"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
            >
              {employees.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="label-text" htmlFor="salary-amount">
            <Banknote className="mr-1 inline h-3.5 w-3.5" />
            Amount (₦)
          </label>
          <input
            id="salary-amount"
            type="text"
            inputMode="numeric"
            className="input-field"
            placeholder="e.g. 80000"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9,]/g, ""))}
          />
          <p className="mt-1 text-xs text-indigo-300">Preview: {livePreview}</p>
        </div>

        {/* Pay period */}
        <div>
          <label className="label-text" htmlFor="salary-period">
            <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
            Pay Period
          </label>
          <input
            id="salary-period"
            type="month"
            className="input-field"
            value={payPeriod}
            onChange={(e) => setPayPeriod(e.target.value)}
            required
          />
        </div>

        {/* Payment date */}
        <div>
          <label className="label-text" htmlFor="salary-date">
            Payment Date
          </label>
          <input
            id="salary-date"
            type="date"
            className="input-field"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
        </div>

        {/* Note */}
        <div>
          <label className="label-text" htmlFor="salary-note">
            <MessageSquare className="mr-1 inline h-3.5 w-3.5" />
            Note (optional)
          </label>
          <input
            id="salary-note"
            type="text"
            className="input-field"
            maxLength={250}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. May salary + transport allowance"
          />
        </div>
      </form>
    </Modal>
  );
}

/* ─── Employees Tab ────────────────────────────────────────────── */

function EmployeesTab({ token }: { token: string | null }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEmployees(token);
      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          className="primary-button"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      ) : error ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
          <XCircle className="h-10 w-10 text-rose-400" />
          <p className="text-sm text-rose-300">{error}</p>
          <button type="button" className="secondary-button" onClick={() => load()}>
            Retry
          </button>
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          title="No employees added yet"
          description="Add employees to the payroll list to start logging their salaries."
          icon={<Users className="h-6 w-6 text-slate-400" />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((emp) => (
            <div key={emp._id} className="glass-panel p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{emp.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">{emp.role}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10">
                  <User className="h-5 w-5 text-indigo-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddEmployeeModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => {
          setIsModalOpen(false);
          load();
        }}
      />
    </div>
  );
}

function AddEmployeeModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await createEmployee({ token, name, role });
      setName("");
      setRole("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add employee.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Add Employee"
      description="Add a staff member to the payroll system. They will not have login access."
      open={open}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="employee-form"
            className="primary-button"
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Adding..." : "Add Employee"}
          </button>
        </div>
      }
    >
      <form id="employee-form" className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </p>
        ) : null}

        <div>
          <label className="label-text" htmlFor="emp-name">
            Full Name
          </label>
          <input
            id="emp-name"
            type="text"
            className="input-field"
            placeholder="e.g. John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            minLength={2}
          />
        </div>

        <div>
          <label className="label-text" htmlFor="emp-role">
            Role / Position
          </label>
          <input
            id="emp-role"
            type="text"
            className="input-field"
            placeholder="e.g. Cleaner, Security, Instructor"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            maxLength={50}
          />
        </div>
      </form>
    </Modal>
  );
}
