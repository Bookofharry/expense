import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Banknote,
  Check,
  ClipboardList,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  X as XIcon,
  XCircle,
} from "lucide-react";

import { useAuth } from "../lib/AuthContext";
import {
  approveBudgetDemandEntry,
  createBudgetDemandEntry,
  fetchBudgetDemands,
  rejectBudgetDemandEntry,
} from "../lib/api";
import { formatCurrency, formatDate } from "../lib/format";
import { EmptyState } from "./EmptyState";
import { Modal } from "./Modal";
import {
  StatusBadge,
  getPriorityVariant,
  getStatusVariant,
} from "./StatusBadge";
import type { BudgetDemand, BudgetPriority } from "../types";

const PRIORITIES: BudgetPriority[] = ["Low", "Medium", "High", "Urgent"];

export function BudgetsScreen() {
  const { token, role } = useAuth();
  const isAdmin = role === "Admin";
  const [demands, setDemands] = useState<BudgetDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<BudgetDemand | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const LIMIT = 25;

  const load = useCallback(async (targetPage = page) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchBudgetDemands(token, targetPage, LIMIT);
      setDemands(result.data);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load budget demands.");
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreated = () => {
    setIsCreateOpen(false);
    setPage(1);
    load(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    load(newPage);
  };

  const openReview = (id: string, action: "approve" | "reject") => {
    setReviewingId(id);
    setReviewAction(action);
    setReviewNote("");
  };

  const handleReview = async () => {
    if (!token || !reviewingId) return;
    setReviewSubmitting(true);
    try {
      const fn = reviewAction === "approve" ? approveBudgetDemandEntry : rejectBudgetDemandEntry;
      await fn({ token, id: reviewingId, reviewNote: reviewNote.trim() || undefined });
      setReviewingId(null);
      setPage(1);
      load(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="section-kicker">Budgets</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Budget Demands</h1>
        </div>
        {!isAdmin && (
          <button
            type="button"
            className="primary-button"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Demand
          </button>
        )}
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
      ) : demands.length === 0 ? (
        <EmptyState
          title="No budget demands yet"
          description="Use the button above to submit your first demand."
          icon={<ClipboardList className="h-6 w-6 text-slate-400" />}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 md:table-cell">Requested By</th>
                <th className="hidden px-4 py-3 lg:table-cell">Date</th>
                {isAdmin ? <th className="px-4 py-3 text-right">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {demands.map((demand) => (
                <tr
                  key={demand._id}
                  className="border-b border-white/5 cursor-pointer transition hover:bg-white/[0.05]"
                  onClick={() => setSelectedDemand(demand)}
                >
                  <td className="max-w-[200px] px-4 py-3">
                    <p className="truncate font-medium text-white">{demand.title}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {demand.justification}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-white">
                    {formatCurrency(demand.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={demand.priority}
                      variant={getPriorityVariant(demand.priority)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={demand.status}
                      variant={getStatusVariant(demand.status)}
                    />
                  </td>
                  <td className="hidden px-4 py-3 text-slate-400 md:table-cell">
                    {demand.createdBy?.name || "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-400 lg:table-cell">
                    {formatDate(demand.createdAt)}
                  </td>
                  {isAdmin ? (
                    <td className="px-4 py-3 text-right">
                      {demand.status === "Pending" ? (
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            className="inline-flex h-8 items-center gap-1 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-2.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              openReview(demand._id, "approve");
                            }}
                          >
                            <Check className="h-3 w-3" />
                            Approve
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-8 items-center gap-1 rounded-xl border border-rose-400/20 bg-rose-500/10 px-2.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              openReview(demand._id, "reject");
                            }}
                          >
                            <XIcon className="h-3 w-3" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">
                          {demand.reviewedBy?.name ?? "—"}
                        </span>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      <CreateBudgetModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleCreated}
      />

      {/* Review modal */}
      <Modal
        title={reviewAction === "approve" ? "Approve Demand" : "Reject Demand"}
        description="Add an optional review note before confirming."
        open={reviewingId !== null}
        onClose={() => setReviewingId(null)}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setReviewingId(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={
                reviewAction === "approve"
                  ? "primary-button !from-emerald-500 !via-emerald-500 !to-teal-500"
                  : "primary-button !from-rose-500 !via-rose-500 !to-pink-500"
              }
              disabled={reviewSubmitting}
              onClick={handleReview}
            >
              {reviewSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {reviewAction === "approve" ? "Confirm Approve" : "Confirm Reject"}
            </button>
          </div>
        }
      >
        <div>
          <label className="label-text" htmlFor="review-note">
            <MessageSquare className="mr-1 inline h-3.5 w-3.5" />
            Review Note (optional)
          </label>
          <textarea
            id="review-note"
            className="input-field resize-none"
            rows={3}
            maxLength={250}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="e.g. Approved — allocate from operational budget."
          />
        </div>
      </Modal>

      {/* View Details Modal */}
      <ViewBudgetModal
        demand={selectedDemand}
        onClose={() => setSelectedDemand(null)}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/8 pt-4">
          <p className="text-xs text-slate-500">
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, totalCount)} of {totalCount} demands
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="secondary-button px-3 py-2 text-xs disabled:opacity-40"
              onClick={() => handlePageChange(page - 1)}
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
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || loading}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Create Budget Modal ────────────────────────────────────────── */

function CreateBudgetModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [justification, setJustification] = useState("");
  const [priority, setPriority] = useState<BudgetPriority>("Medium");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setJustification("");
    setPriority("Medium");
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount.replace(/,/g, ""));

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (!justification.trim()) {
      setError("Justification is required.");
      return;
    }
    if (!token) return;

    setSubmitting(true);
    setError(null);

    try {
      await createBudgetDemandEntry({
        token,
        title: title.trim(),
        amount: numericAmount,
        justification: justification.trim(),
        priority,
      });
      resetForm();
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit demand.");
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
      title="New Budget Demand"
      description="Submit a budget request for admin review."
      open={open}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="budget-form"
            className="primary-button"
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Submitting..." : "Submit Demand"}
          </button>
        </div>
      }
    >
      <form id="budget-form" className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </p>
        ) : null}

        {/* Title */}
        <div>
          <label className="label-text" htmlFor="budget-title">
            <FileText className="mr-1 inline h-3.5 w-3.5" />
            Title
          </label>
          <input
            id="budget-title"
            type="text"
            className="input-field"
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New laptops for lab"
            required
          />
        </div>

        {/* Amount */}
        <div>
          <label className="label-text" htmlFor="budget-amount">
            <Banknote className="mr-1 inline h-3.5 w-3.5" />
            Amount (₦)
          </label>
          <input
            id="budget-amount"
            type="text"
            inputMode="numeric"
            className="input-field"
            placeholder="e.g. 150000"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9,]/g, ""))}
          />
          <p className="mt-1 text-xs text-indigo-300">Preview: {livePreview}</p>
        </div>

        {/* Justification */}
        <div>
          <label className="label-text" htmlFor="budget-justification">
            Justification
          </label>
          <textarea
            id="budget-justification"
            className="input-field resize-none"
            rows={3}
            maxLength={500}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Explain why this budget is needed..."
            required
          />
        </div>

        {/* Priority */}
        <div>
          <label className="label-text" htmlFor="budget-priority">
            Priority
          </label>
          <select
            id="budget-priority"
            className="input-field"
            value={priority}
            onChange={(e) => setPriority(e.target.value as BudgetPriority)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}

/* ─── View Budget Modal ────────────────────────────────────────── */

function ViewBudgetModal({
  demand,
  onClose,
}: {
  demand: BudgetDemand | null;
  onClose: () => void;
}) {
  if (!demand) return null;

  return (
    <Modal
      title="Budget Demand Details"
      description={`Requested by ${demand.createdBy?.name || "Unknown"} on ${formatDate(demand.createdAt)}`}
      open={true}
      onClose={onClose}
    >
      <div className="space-y-6">
        <div className="flex items-start justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div>
            <h4 className="font-semibold text-white">{demand.title}</h4>
            <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(demand.amount)}</p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <StatusBadge label={demand.status} variant={getStatusVariant(demand.status)} />
            <StatusBadge label={demand.priority} variant={getPriorityVariant(demand.priority)} />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-400">Justification</p>
            <p className="mt-1 text-sm leading-relaxed text-white">
              {demand.justification}
            </p>
          </div>

          {demand.status !== "Pending" && (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-sm font-medium text-slate-400">Review Note</p>
              <p className="mt-1 text-sm text-white">
                {demand.reviewNote || "No specific notes provided by the admin."}
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Reviewed by {demand.reviewedBy?.name || "Admin"} on {demand.reviewedAt ? formatDate(demand.reviewedAt) : "—"}
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
