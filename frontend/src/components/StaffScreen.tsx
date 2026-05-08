import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Loader2,
  Lock,
  Mail,
  Plus,
  User,
  Users,
  XCircle,
} from "lucide-react";

import { useAuth } from "../lib/AuthContext";
import { createStaffUser, fetchStaffUsers } from "../lib/api";
import { formatDate, getInitials } from "../lib/format";
import { EmptyState } from "./EmptyState";
import { Modal } from "./Modal";
import type { User as UserType, UserRole } from "../types";

const ROLES: UserRole[] = ["Clerk", "Instructor"];

export function StaffScreen() {
  const { token } = useAuth();
  const [staff, setStaff] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStaffUsers(token);
      setStaff(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreated = () => {
    setIsModalOpen(false);
    load();
  };

  const roleBadgeColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "border-violet-400/25 bg-violet-500/10 text-violet-300";
      case "Clerk":
        return "border-blue-400/25 bg-blue-500/10 text-blue-300";
      default:
        return "border-teal-400/25 bg-teal-500/10 text-teal-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="section-kicker">Administration</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Staff Management</h1>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Staff
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
          <button type="button" className="secondary-button" onClick={load}>
            Retry
          </button>
        </div>
      ) : staff.length === 0 ? (
        <EmptyState
          title="No staff found"
          description="Add staff members using the button above."
          icon={<Users className="h-6 w-6 text-slate-400" />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => (
            <div key={member.id} className="glass-subpanel p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white">
                  {getInitials(member.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {member.name}
                  </p>
                  <p className="truncate text-xs text-slate-400">{member.email}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${roleBadgeColor(member.role)}`}
                >
                  {member.role}
                </span>
                <span className="text-xs text-slate-500">
                  Joined {formatDate(member.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddStaffModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}

/* ─── Add Staff Modal ──────────────────────────────────────────── */

function AddStaffModal({
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("Clerk");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("Clerk");
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!token) return;

    setSubmitting(true);
    setError(null);

    try {
      await createStaffUser({
        token,
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      resetForm();
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add staff.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Add Staff Member"
      description="Create a new account for a team member."
      open={open}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="staff-form"
            className="primary-button"
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Creating..." : "Create Account"}
          </button>
        </div>
      }
    >
      <form id="staff-form" className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </p>
        ) : null}

        <div>
          <label className="label-text" htmlFor="staff-name">
            <User className="mr-1 inline h-3.5 w-3.5" />
            Full Name
          </label>
          <input
            id="staff-name"
            type="text"
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. John Doe"
            required
          />
        </div>

        <div>
          <label className="label-text" htmlFor="staff-email">
            <Mail className="mr-1 inline h-3.5 w-3.5" />
            Email
          </label>
          <input
            id="staff-email"
            type="email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. john@techminds.com"
            required
          />
        </div>

        <div>
          <label className="label-text" htmlFor="staff-password">
            <Lock className="mr-1 inline h-3.5 w-3.5" />
            Password
          </label>
          <input
            id="staff-password"
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            required
          />
        </div>

        <div>
          <label className="label-text" htmlFor="staff-role">
            Role
          </label>
          <select
            id="staff-role"
            className="input-field"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}
