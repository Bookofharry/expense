import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
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
import { fetchDashboardSummary } from "../lib/api";
import { formatCurrency, formatDateTime } from "../lib/format";
import { EmptyState } from "./EmptyState";
import type { DashboardSummary } from "../types";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const summary = await fetchDashboardSummary(token);
      setData(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
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
      label: "Pending Budget Demands",
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
        <h2 className="mb-4 text-lg font-semibold text-white">Recent Activity</h2>
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
