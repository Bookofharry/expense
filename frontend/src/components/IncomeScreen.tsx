import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Banknote,
  CalendarDays,
  FileText,
  Loader2,
  Plus,
  User,
  XCircle,
} from "lucide-react";

import { useAuth } from "../lib/AuthContext";
import { createIncomeEntry, fetchIncomes } from "../lib/api";
import { formatCurrency, formatDate } from "../lib/format";
import { EmptyState } from "./EmptyState";
import { Modal } from "./Modal";
import type { IncomeCategory, IncomeRecord } from "../types";

const CATEGORIES: IncomeCategory[] = ["Tuition", "Workspace", "ID Card", "Other"];

export function IncomeScreen() {
  const { token, role } = useAuth();
  const isAdmin = role === "Admin";
  const [records, setRecords] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<IncomeRecord | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const LIMIT = 25;

  const load = useCallback(async (targetPage = page) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchIncomes(token, targetPage, LIMIT);
      setRecords(result.data);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load income records.");
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreated = () => {
    setIsModalOpen(false);
    setPage(1);
    load(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    load(newPage);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="section-kicker">Income</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Daily Income Log</h1>
        </div>
        {!isAdmin && (
          <button
            type="button"
            className="primary-button"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Log Income
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
      ) : records.length === 0 ? (
        <EmptyState
          title="No income logged yet"
          description="Use the button above to log your first income entry."
          icon={<Banknote className="h-6 w-6 text-slate-400" />}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="hidden px-4 py-3 md:table-cell">Description</th>
                <th className="hidden px-4 py-3 lg:table-cell">Student</th>
                <th className="hidden px-4 py-3 lg:table-cell">Logged By</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr
                  key={record._id}
                  className="border-b border-white/5 cursor-pointer transition hover:bg-white/[0.05]"
                  onClick={() => setSelectedRecord(record)}
                >
                  <td className="px-4 py-3 text-slate-300">
                    {formatDate(record.entryDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full border border-indigo-400/25 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
                      {record.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-white">
                    {formatCurrency(record.amount)}
                  </td>
                  <td className="hidden max-w-[200px] truncate px-4 py-3 text-slate-400 md:table-cell">
                    {record.description || "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-400 lg:table-cell">
                    {record.studentName || "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-slate-400 lg:table-cell">
                    {record.createdBy?.name || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <IncomeModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreated}
      />

      <ViewIncomeModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/8 pt-4">
          <p className="text-xs text-slate-500">
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, totalCount)} of {totalCount} records
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

/* ─── Create Income Modal ────────────────────────────────────────── */

function IncomeModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { token } = useAuth();
  const [category, setCategory] = useState<IncomeCategory>("Tuition");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [studentName, setStudentName] = useState("");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setCategory("Tuition");
    setAmount("");
    setDescription("");
    setStudentName("");
    setEntryDate(new Date().toISOString().split("T")[0]);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount.replace(/,/g, ""));

    if (!numericAmount || numericAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!token) return;
    setSubmitting(true);
    setError(null);

    try {
      await createIncomeEntry({
        token,
        category,
        amount: numericAmount,
        description: description.trim() || undefined,
        studentName: studentName.trim() || undefined,
        entryDate: entryDate || undefined,
      });
      resetForm();
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log income.");
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
      title="Log Income"
      description="Record a new income entry for the academy."
      open={open}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="income-form"
            className="primary-button"
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Logging..." : "Log Income"}
          </button>
        </div>
      }
    >
      <form id="income-form" className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </p>
        ) : null}

        {/* Category */}
        <div>
          <label className="label-text" htmlFor="income-category">
            <FileText className="mr-1 inline h-3.5 w-3.5" />
            Category
          </label>
          <select
            id="income-category"
            className="input-field"
            value={category}
            onChange={(e) => setCategory(e.target.value as IncomeCategory)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="label-text" htmlFor="income-amount">
            <Banknote className="mr-1 inline h-3.5 w-3.5" />
            Amount (₦)
          </label>
          <input
            id="income-amount"
            type="text"
            inputMode="numeric"
            className="input-field"
            placeholder="e.g. 25000"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9,]/g, ""))}
          />
          <p className="mt-1 text-xs text-indigo-300">Preview: {livePreview}</p>
        </div>

        {/* Description */}
        <div>
          <label className="label-text" htmlFor="income-description">
            Description (optional)
          </label>
          <textarea
            id="income-description"
            className="input-field resize-none"
            rows={2}
            maxLength={250}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Term 2 tuition payment"
          />
        </div>

        {/* Student name */}
        <div>
          <label className="label-text" htmlFor="income-student">
            <User className="mr-1 inline h-3.5 w-3.5" />
            Student Name (optional)
          </label>
          <input
            id="income-student"
            type="text"
            className="input-field"
            maxLength={120}
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="e.g. John Doe"
          />
        </div>

        {/* Date */}
        <div>
          <label className="label-text" htmlFor="income-date">
            <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
            Entry Date
          </label>
          <input
            id="income-date"
            type="date"
            className="input-field"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}

/* ─── View Income Modal ────────────────────────────────────────── */

function ViewIncomeModal({
  record,
  onClose,
}: {
  record: IncomeRecord | null;
  onClose: () => void;
}) {
  if (!record) return null;

  return (
    <Modal
      title="Income Details"
      description={`Logged by ${record.createdBy?.name || "Unknown"} on ${formatDate(record.entryDate)}`}
      open={true}
      onClose={onClose}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div>
            <p className="text-sm font-medium text-slate-400">Amount</p>
            <p className="mt-1 text-2xl font-bold text-white">{formatCurrency(record.amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-400">Category</p>
            <span className="mt-2 inline-flex rounded-full border border-indigo-400/25 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
              {record.category}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-400">Description</p>
            <p className="mt-1 text-sm text-white">
              {record.description || "No description provided."}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
            <div>
              <p className="text-sm font-medium text-slate-400">Student Name</p>
              <p className="mt-1 text-sm text-white">{record.studentName || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Date Logged</p>
              <p className="mt-1 text-sm text-white">{formatDate(record.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
