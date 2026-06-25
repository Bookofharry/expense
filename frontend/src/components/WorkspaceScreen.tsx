import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Building2,
  CreditCard,
  Edit2,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UserX,
  XCircle,
} from "lucide-react";

import { useAuth } from "../lib/AuthContext";
import {
  deactivateWorkspaceUser,
  fetchWorkspacePayments,
  fetchWorkspaceStats,
  fetchWorkspaceUsers,
  registerWorkspaceUser,
  renewWorkspaceUser,
  updateWorkspaceUserInfo,
} from "../lib/api";
import { formatCurrency, formatDate } from "../lib/format";
import type {
  WorkspacePlan,
  WorkspacePaymentRecord,
  WorkspaceStats,
  WorkspaceStatus,
  WorkspaceUser,
} from "../types";
import { EmptyState } from "./EmptyState";
import { Modal } from "./Modal";
import { StatusBadge, getWorkspaceStatusVariant } from "./StatusBadge";

const PLAN_AMOUNTS: Record<WorkspacePlan, string> = {
  Day: "₦2,000",
  Week: "₦7,000",
  Month: "₦20,000",
};

const FILTER_OPTIONS = ["All", "Active", "Expiring Soon", "Expired", "Inactive"] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

function getExpiryLabel(expiryDate: string, status: WorkspaceStatus): React.ReactNode {
  if (status === "Inactive") {
    return <span className="text-xs text-slate-600">Deactivated</span>;
  }
  const diff = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86_400_000);
  if (diff > 2)
    return (
      <span className="text-xs text-slate-300">
        {formatDate(expiryDate)}{" "}
        <span className="text-slate-500">({diff}d left)</span>
      </span>
    );
  if (diff > 0)
    return (
      <span className="text-xs font-medium text-amber-300">
        {formatDate(expiryDate)}{" "}
        <span className="text-amber-400">({diff}d left)</span>
      </span>
    );
  if (diff === 0)
    return <span className="text-xs font-medium text-amber-300">Expires today</span>;
  return (
    <span className="text-xs font-medium text-rose-400">{Math.abs(diff)}d overdue</span>
  );
}

// ─── WorkspaceScreen ──────────────────────────────────────────────────────────

export function WorkspaceScreen() {
  const { token, role } = useAuth();
  const isAdmin = role === "Admin";

  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterOption>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const LIMIT = 25;

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [renewingUser, setRenewingUser] = useState<WorkspaceUser | null>(null);
  const [editingUser, setEditingUser] = useState<WorkspaceUser | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<WorkspaceUser | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [viewingPaymentsUser, setViewingPaymentsUser] = useState<WorkspaceUser | null>(null);

  const loadStats = useCallback(async () => {
    if (!token) return;
    try {
      const result = await fetchWorkspaceStats(token);
      setStats(result);
    } catch {
      // Non-critical — stats card will stay empty
    }
  }, [token]);

  const load = useCallback(
    async (targetPage = 1) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const result = await fetchWorkspaceUsers(token, targetPage, LIMIT, statusFilter, search);
        setUsers(result.data);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load workspace users.");
      } finally {
        setLoading(false);
      }
    },
    [token, statusFilter, search]
  );

  const refresh = useCallback(() => {
    setPage(1);
    loadStats();
    load(1);
  }, [loadStats, load]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    setPage(1);
    load(1);
  }, [load]);

  const handleDeactivate = async () => {
    if (!token || !deactivatingUser) return;
    setDeactivateLoading(true);
    try {
      await deactivateWorkspaceUser(token, deactivatingUser._id);
      setDeactivatingUser(null);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate user.");
      setDeactivatingUser(null);
    } finally {
      setDeactivateLoading(false);
    }
  };

  const filterCounts: Partial<Record<FilterOption, number>> = {
    Active: stats?.activeCount,
    "Expiring Soon": stats?.expiringSoonCount,
    Expired: stats?.expiredCount,
    Inactive: stats?.inactiveCount,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="section-kicker">Hub</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Workspace Management</h1>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => setIsRegisterOpen(true)}
          disabled={stats !== null && stats.availableCount === 0}
        >
          <Plus className="h-4 w-4" />
          Register User
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SlotCard
            value={`${stats.availableCount}/${stats.totalSlots}`}
            label="Slots Available"
            sub={`${stats.totalSlots - stats.availableCount} occupied`}
            color="indigo"
          />
          <SlotCard value={stats.activeCount} label="Active Users" color="emerald" />
          <SlotCard
            value={stats.expiringSoonCount}
            label="Expiring Soon"
            color="amber"
            alert={stats.expiringSoonCount > 0}
          />
          <SlotCard
            value={stats.expiredCount}
            label="Expired"
            color="rose"
            alert={stats.expiredCount > 0}
          />
        </div>
      )}

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {FILTER_OPTIONS.map((f) => {
            const count = filterCounts[f];
            const active = statusFilter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setStatusFilter(f)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-300"
                    : "border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {f}
                {count !== undefined && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active
                        ? "bg-indigo-500/30 text-indigo-200"
                        : "bg-white/10 text-slate-300"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            className="input-field w-48 py-2 pl-8 text-sm"
            placeholder="Name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        </div>
      ) : error ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
          <XCircle className="h-10 w-10 text-rose-400" />
          <p className="text-sm text-rose-300">{error}</p>
          <button type="button" className="secondary-button" onClick={refresh}>
            Retry
          </button>
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-6 w-6 text-slate-400" />}
          title={
            statusFilter === "All"
              ? "No workspace users yet"
              : `No ${statusFilter.toLowerCase()} users`
          }
          description={
            statusFilter === "All" ? "Use the Register User button above to get started." : ""
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/8">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Slot</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user._id}
                  className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="max-w-[200px] px-4 py-3">
                    <p className="truncate font-medium text-white">{user.name}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{user.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-indigo-400">#{user.slotNumber}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300">
                    {user.status === "Inactive" ? "—" : user.currentPlan}
                  </td>
                  <td className="px-4 py-3">
                    {getExpiryLabel(user.planExpiryDate, user.status)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={user.status}
                      variant={getWorkspaceStatusVariant(user.status)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      {user.status !== "Inactive" && (
                        <button
                          type="button"
                          title="Renew Plan"
                          className="icon-button text-emerald-400 hover:text-emerald-300"
                          onClick={() => setRenewingUser(user)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      )}
                      {user.status === "Expired" && (
                        <button
                          type="button"
                          title="Deactivate — free slot"
                          className="icon-button text-rose-400 hover:text-rose-300"
                          onClick={() => setDeactivatingUser(user)}
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Edit Info"
                        className="icon-button text-slate-400 hover:text-white"
                        onClick={() => setEditingUser(user)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          title="Payment History"
                          className="icon-button text-slate-400 hover:text-indigo-300"
                          onClick={() => setViewingPaymentsUser(user)}
                        >
                          <History className="h-4 w-4" />
                        </button>
                      )}
                    </div>
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
            {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="secondary-button px-3 py-2 text-xs disabled:opacity-40"
              disabled={page <= 1 || loading}
              onClick={() => {
                const p = page - 1;
                setPage(p);
                load(p);
              }}
            >
              ← Prev
            </button>
            <span className="text-xs text-slate-400">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className="secondary-button px-3 py-2 text-xs disabled:opacity-40"
              disabled={page >= totalPages || loading}
              onClick={() => {
                const p = page + 1;
                setPage(p);
                load(p);
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <RegisterUserModal
        open={isRegisterOpen}
        stats={stats}
        onClose={() => setIsRegisterOpen(false)}
        onRegistered={() => {
          setIsRegisterOpen(false);
          refresh();
        }}
      />

      <RenewModal
        user={renewingUser}
        onClose={() => setRenewingUser(null)}
        onRenewed={() => {
          setRenewingUser(null);
          refresh();
        }}
      />

      <EditUserModal
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSaved={() => {
          setEditingUser(null);
          refresh();
        }}
      />

      {isAdmin && (
        <PaymentHistoryModal
          user={viewingPaymentsUser}
          onClose={() => setViewingPaymentsUser(null)}
        />
      )}

      {/* Deactivate confirmation */}
      <Modal
        title="Deactivate User"
        description={
          deactivatingUser
            ? `${deactivatingUser.name} — Slot #${deactivatingUser.slotNumber}`
            : undefined
        }
        open={deactivatingUser !== null}
        onClose={() => setDeactivatingUser(null)}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setDeactivatingUser(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="primary-button !from-rose-500 !via-rose-500 !to-pink-500"
              disabled={deactivateLoading}
              onClick={handleDeactivate}
            >
              {deactivateLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserX className="h-4 w-4" />
              )}
              {deactivateLoading ? "Deactivating…" : "Deactivate"}
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-300">
          Their plan has expired. Deactivating will free{" "}
          <strong className="text-white">Slot #{deactivatingUser?.slotNumber}</strong> for a
          new user. This cannot be undone — if they want to return, register them fresh.
        </p>
      </Modal>
    </div>
  );
}

// ─── SlotCard ─────────────────────────────────────────────────────────────────

interface SlotCardProps {
  value: string | number;
  label: string;
  sub?: string;
  color: "indigo" | "emerald" | "amber" | "rose";
  alert?: boolean;
}

function SlotCard({ value, label, sub, color, alert }: SlotCardProps) {
  const border = {
    indigo: "border-indigo-400/20",
    emerald: "border-emerald-400/20",
    amber: alert ? "border-amber-400/30" : "border-amber-400/15",
    rose: alert ? "border-rose-400/30" : "border-rose-400/15",
  }[color];

  const bg = {
    indigo: "bg-indigo-500/10",
    emerald: "bg-emerald-500/10",
    amber: alert ? "bg-amber-500/15" : "bg-amber-500/8",
    rose: alert ? "bg-rose-500/15" : "bg-rose-500/8",
  }[color];

  const text = {
    indigo: "text-indigo-300",
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    rose: "text-rose-300",
  }[color];

  return (
    <div className={`rounded-2xl border ${border} ${bg} p-4`}>
      <p className={`text-2xl font-bold ${text}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{label}</p>
      {sub && <p className="mt-0.5 text-[10px] text-slate-600">{sub}</p>}
    </div>
  );
}

// ─── RegisterUserModal ────────────────────────────────────────────────────────

function RegisterUserModal({
  open,
  stats,
  onClose,
  onRegistered,
}: {
  open: boolean;
  stats: WorkspaceStats | null;
  onClose: () => void;
  onRegistered: () => void;
}) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [slotNumber, setSlotNumber] = useState<number | "">("");
  const [plan, setPlan] = useState<WorkspacePlan>("Month");
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setEmail("");
      setPhone("");
      setSlotNumber("");
      setPlan("Month");
      setStartDate(new Date().toISOString().slice(0, 10));
      setNotes("");
      setFormError(null);
    }
  }, [open]);

  const availableSlots = stats?.availableSlotNumbers ?? [];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || slotNumber === "") return;
    setSubmitting(true);
    setFormError(null);
    try {
      await registerWorkspaceUser({
        token,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        slotNumber: Number(slotNumber),
        plan,
        startDate: startDate || undefined,
        notes: notes.trim() || undefined,
      });
      onRegistered();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Register Workspace User"
      description="Assign a slot and payment plan."
      open={open}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="register-ws-form"
            className="primary-button"
            disabled={submitting || availableSlots.length === 0}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Registering…" : "Register User"}
          </button>
        </div>
      }
    >
      <form id="register-ws-form" className="space-y-4" onSubmit={handleSubmit}>
        {formError && (
          <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {formError}
          </p>
        )}
        {availableSlots.length === 0 && (
          <p className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            All slots are currently occupied. Deactivate an expired user first.
          </p>
        )}

        <div>
          <label className="label-text" htmlFor="ws-name">
            Full Name
          </label>
          <input
            id="ws-name"
            type="text"
            className="input-field"
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Emeka Okafor"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text" htmlFor="ws-email">
              Email
            </label>
            <input
              id="ws-email"
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
          </div>
          <div>
            <label className="label-text" htmlFor="ws-phone">
              Phone
            </label>
            <input
              id="ws-phone"
              type="tel"
              className="input-field"
              maxLength={20}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08012345678"
              required
            />
          </div>
          <div>
            <label className="label-text" htmlFor="ws-slot">
              Slot Number
            </label>
            <select
              id="ws-slot"
              className="input-field"
              value={slotNumber}
              onChange={(e) => setSlotNumber(e.target.value ? Number(e.target.value) : "")}
              required
            >
              <option value="">Select slot</option>
              {availableSlots.map((n) => (
                <option key={n} value={n}>
                  Slot #{n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text" htmlFor="ws-plan">
              Plan
            </label>
            <select
              id="ws-plan"
              className="input-field"
              value={plan}
              onChange={(e) => setPlan(e.target.value as WorkspacePlan)}
            >
              <option value="Day">Day — ₦2,000 (1 day)</option>
              <option value="Week">Week — ₦7,000 (7 days)</option>
              <option value="Month">Month — ₦20,000 (30 days)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label-text" htmlFor="ws-start">
            Start Date
          </label>
          <input
            id="ws-start"
            type="date"
            className="input-field"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label-text" htmlFor="ws-notes">
            Notes{" "}
            <span className="text-slate-600">(optional)</span>
          </label>
          <textarea
            id="ws-notes"
            className="input-field resize-none"
            rows={2}
            maxLength={300}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Pays via transfer, sits near the window…"
          />
        </div>
      </form>
    </Modal>
  );
}

// ─── RenewModal ───────────────────────────────────────────────────────────────

function RenewModal({
  user,
  onClose,
  onRenewed,
}: {
  user: WorkspaceUser | null;
  onClose: () => void;
  onRenewed: () => void;
}) {
  const { token } = useAuth();
  const [plan, setPlan] = useState<WorkspacePlan>("Month");
  const [startDate, setStartDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setPlan("Month");
      setStartDate(new Date().toISOString().slice(0, 10));
      setFormError(null);
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await renewWorkspaceUser({ token, id: user._id, plan, startDate: startDate || undefined });
      onRenewed();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Renewal failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Renew Plan"
      description={user ? `${user.name} — Slot #${user.slotNumber}` : undefined}
      open={user !== null}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="renew-ws-form"
            className="primary-button"
            disabled={submitting}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Processing…" : `Renew — ${PLAN_AMOUNTS[plan]}`}
          </button>
        </div>
      }
    >
      <form id="renew-ws-form" className="space-y-4" onSubmit={handleSubmit}>
        {formError && (
          <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {formError}
          </p>
        )}
        <div>
          <label className="label-text" htmlFor="renew-plan">
            New Plan
          </label>
          <select
            id="renew-plan"
            className="input-field"
            value={plan}
            onChange={(e) => setPlan(e.target.value as WorkspacePlan)}
          >
            <option value="Day">Day — ₦2,000 (+1 day)</option>
            <option value="Week">Week — ₦7,000 (+7 days)</option>
            <option value="Month">Month — ₦20,000 (+30 days)</option>
          </select>
        </div>
        <div>
          <label className="label-text" htmlFor="renew-start">
            Start Date
          </label>
          <input
            id="renew-start"
            type="date"
            className="input-field"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500">
            A fresh plan starts from this date. Defaults to today.
          </p>
        </div>
      </form>
    </Modal>
  );
}

// ─── EditUserModal ────────────────────────────────────────────────────────────

function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: WorkspaceUser | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone);
      setNotes(user.notes || "");
      setFormError(null);
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await updateWorkspaceUserInfo({
        token,
        id: user._id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
      });
      onSaved();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Edit User Info"
      description={user ? `Slot #${user.slotNumber}` : undefined}
      open={user !== null}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="edit-ws-form"
            className="primary-button"
            disabled={submitting}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      }
    >
      <form id="edit-ws-form" className="space-y-4" onSubmit={handleSubmit}>
        {formError && (
          <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {formError}
          </p>
        )}
        <div>
          <label className="label-text" htmlFor="edit-ws-name">
            Name
          </label>
          <input
            id="edit-ws-name"
            type="text"
            className="input-field"
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text" htmlFor="edit-ws-email">
              Email
            </label>
            <input
              id="edit-ws-email"
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label-text" htmlFor="edit-ws-phone">
              Phone
            </label>
            <input
              id="edit-ws-phone"
              type="tel"
              className="input-field"
              maxLength={20}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label className="label-text" htmlFor="edit-ws-notes">
            Notes
          </label>
          <textarea
            id="edit-ws-notes"
            className="input-field resize-none"
            rows={2}
            maxLength={300}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}

// ─── PaymentHistoryModal ──────────────────────────────────────────────────────

function PaymentHistoryModal({
  user,
  onClose,
}: {
  user: WorkspaceUser | null;
  onClose: () => void;
}) {
  const { token } = useAuth();
  const [payments, setPayments] = useState<WorkspacePaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !token) return;
    setLoading(true);
    setError(null);
    fetchWorkspacePayments(token, user._id)
      .then(setPayments)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load payments.")
      )
      .finally(() => setLoading(false));
  }, [user, token]);

  return (
    <Modal
      title="Payment History"
      description={user ? `${user.name} — Slot #${user.slotNumber}` : undefined}
      open={user !== null}
      onClose={onClose}
    >
      {loading ? (
        <div className="flex min-h-[15vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        </div>
      ) : error ? (
        <p className="text-sm text-rose-300">{error}</p>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-5 w-5 text-slate-400" />}
          title="No payment records"
        />
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <div
              key={p._id}
              className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-white">{p.plan} Plan</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDate(p.startDate)} → {formatDate(p.expiryDate)}
                </p>
                {p.recordedBy && (
                  <p className="mt-0.5 text-xs text-slate-600">by {p.recordedBy.name}</p>
                )}
              </div>
              <p className="ml-4 shrink-0 text-sm font-bold text-white">
                {formatCurrency(p.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
