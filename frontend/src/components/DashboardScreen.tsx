import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Building2,
  CheckCircle2,
  ClipboardList,
  Loader2,
  TrendingDown,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../lib/AuthContext";
import { fetchDashboardSummary, fetchWorkspaceStats } from "../lib/api";
import { formatCurrency, formatDateTime } from "../lib/format";
import { EmptyState } from "./EmptyState";
import type { DashboardSummary, WorkspaceStats } from "../types";

// ─── Hub Widget ───────────────────────────────────────────────────────────────

function HubWidget({
  stats,
  onManage,
}: {
  stats: WorkspaceStats;
  onManage: () => void;
}) {
  const hasExpired = stats.expiredCount > 0;
  const hasExpiring = stats.expiringSoonCount > 0;
  const occupied = stats.totalSlots - stats.availableCount;

  return (
    <div className="glass-subpanel p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Hub Workspace
          </h2>
          {hasExpired && (
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" title="Expired users need attention" />
          )}
        </div>
        <button
          type="button"
          onClick={onManage}
          className="flex items-center gap-1 text-xs text-indigo-400 transition hover:text-indigo-300"
        >
          Manage <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Occupied slots */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-center">
          <p className="text-xl font-bold text-white">
            {occupied}
            <span className="text-sm font-normal text-slate-500">/{stats.totalSlots}</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Slots Occupied</p>
        </div>

        {/* Active */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-500/8 px-3 py-3 text-center">
          <p className="text-xl font-bold text-emerald-300">{stats.activeCount}</p>
          <p className="mt-0.5 text-xs text-slate-500">Active</p>
        </div>

        {/* Expiring Soon */}
        <div
          className={`flex flex-col items-center justify-center rounded-2xl px-3 py-3 text-center border ${
            hasExpiring
              ? "border-amber-400/25 bg-amber-500/10"
              : "border-white/8 bg-white/[0.03]"
          }`}
        >
          <p className={`text-xl font-bold ${hasExpiring ? "text-amber-300" : "text-slate-500"}`}>
            {stats.expiringSoonCount}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Expiring Soon</p>
        </div>

        {/* Expired */}
        <div
          className={`flex flex-col items-center justify-center rounded-2xl px-3 py-3 text-center border ${
            hasExpired
              ? "border-rose-400/25 bg-rose-500/10"
              : "border-white/8 bg-white/[0.03]"
          }`}
        >
          <p className={`text-xl font-bold ${hasExpired ? "text-rose-300" : "text-slate-500"}`}>
            {stats.expiredCount}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Expired</p>
          {hasExpired && (
            <p className="mt-0.5 text-[10px] font-medium text-rose-400">Needs action</p>
          )}
        </div>
      </div>
    </div>
  );
}

const bannerStyles = {
  Optimal: {
    border: "border-emerald-400/25",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
  },
  Warning: {
    border: "border-amber-400/25",
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
  },
  Critical: {
    border: "border-rose-400/25",
    bg: "bg-rose-500/10",
    text: "text-rose-300",
    icon: <XCircle className="h-5 w-5 text-rose-400" />,
  },
};

export function DashboardScreen() {
  const { token, role } = useAuth();
  const isAdmin = role === "Admin";
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [workspaceStats, setWorkspaceStats] = useState<WorkspaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [summaryResult, wsResult] = await Promise.allSettled([
        fetchDashboardSummary(token),
        fetchWorkspaceStats(token),
      ]);
      if (summaryResult.status === "fulfilled") setData(summaryResult.value);
      else throw summaryResult.reason;
      if (wsResult.status === "fulfilled") setWorkspaceStats(wsResult.value);
      // workspace stats failure is non-critical — widget just won't show
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
    // Keep dashboard live — poll every 30 seconds
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <XCircle className="h-10 w-10 text-rose-400" />
        <p className="text-sm text-rose-300">{error}</p>
        <button type="button" className="secondary-button" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { statusBanner, financialSnapshot, activityFeed } = data;
  const banner = bannerStyles[statusBanner.label] ?? bannerStyles.Optimal;

  const cards = [
    {
      label: "Total Income (This Month)",
      value: formatCurrency(financialSnapshot.totalIncomeThisMonth),
      icon: <TrendingUp className="h-5 w-5 text-emerald-400" />,
    },
    {
      label: "Total Income (All Time)",
      value: formatCurrency(financialSnapshot.allTimeIncome),
      icon: <Banknote className="h-5 w-5 text-emerald-500" />,
      adminOnly: true,
    },
    {
      label: "Approved Expenditure (This Month)",
      value: formatCurrency(financialSnapshot.totalApprovedExpenditureThisMonth),
      icon: <TrendingDown className="h-5 w-5 text-rose-400" />,
    },
    {
      label: "Approved Expenditure (All Time)",
      value: formatCurrency(financialSnapshot.allTimeApprovedExpenditure),
      icon: <TrendingDown className="h-5 w-5 text-rose-500" />,
      adminOnly: true,
    },
    {
      label: "Salary Paid (This Month)",
      value: formatCurrency(financialSnapshot.totalSalaryPaidThisMonth),
      icon: <Wallet className="h-5 w-5 text-amber-400" />,
      adminOnly: true,
    },
    {
      label: "Awaiting Approval (Budgets)",
      value: formatCurrency(financialSnapshot.totalPendingBudgetDemands),
      icon: <ClipboardList className="h-5 w-5 text-amber-400" />,
    },
    {
      label: "Current Cash Position",
      value: formatCurrency(financialSnapshot.currentCashPosition),
      icon: <Wallet className="h-5 w-5 text-indigo-400" />,
    },
  ].filter(card => !card.adminOnly || isAdmin);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <p className="section-kicker">Command Center</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          Workspace Overview
        </h1>
      </div>

      {/* Status banner */}
      <div
        className={`flex items-center gap-3 rounded-2xl border ${banner.border} ${banner.bg} px-5 py-4`}
      >
        {banner.icon}
        <div>
          <p className={`text-sm font-bold uppercase tracking-wider ${banner.text}`}>
            {statusBanner.label}
          </p>
          <p className="text-sm text-slate-300">{statusBanner.message}</p>
        </div>
      </div>

      {/* Financial snapshot cards */}
      <div className={`grid gap-4 sm:grid-cols-2 ${isAdmin ? 'xl:grid-cols-3' : 'xl:grid-cols-4'}`}>
        {cards.map((card) => (
          <div key={card.label} className="glass-subpanel p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-slate-400">
                {card.label}
              </p>
              {card.icon}
            </div>
            <p className="mt-3 text-2xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Hub Workspace Widget — visible to Admin and Clerk */}
      {workspaceStats && (role === "Admin" || role === "Clerk") && (
        <HubWidget stats={workspaceStats} onManage={() => navigate("/workspace")} />
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        {!isAdmin && (
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate("/income")}
          >
            <Banknote className="h-4 w-4" />
            Log Income
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
        {!isAdmin && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/budgets")}
          >
            <ClipboardList className="h-4 w-4" />
            Request Budget
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Activity feed */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Live Activity</h2>
        {activityFeed.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description="Income and budget activity will appear here."
          />
        ) : (
          <div className="space-y-2">
            {activityFeed.map((item) => (
              <div
                key={item.id}
                className="glass-subpanel flex items-center gap-4 px-5 py-4"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    item.type === "income"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-violet-500/15 text-violet-400"
                  }`}
                >
                  {item.type === "income" ? (
                    <Banknote className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {item.actor} · {formatDateTime(item.timestamp)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-white">
                  {formatCurrency(item.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
