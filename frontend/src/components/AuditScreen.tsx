import { useState, useEffect, useCallback } from "react";
import { fetchAuditLogs } from "../lib/api";
import { formatDate } from "../lib/format";
import { useAuth } from "../lib/AuthContext";
import type { AuditLog } from "../types";
import { ShieldAlert, Server, MapPin, MonitorSmartphone, KeySquare } from "lucide-react";

export function AuditScreen() {
  const { token, user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    if (!token || user?.role !== "Admin") return;
    try {
      setLoading(true);
      const data = await fetchAuditLogs(token);
      setLogs(data);
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  if (user?.role !== "Admin") {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <ShieldAlert className="mb-4 h-12 w-12 text-rose-500/50" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="mt-2 text-slate-400">Only administrators can view the audit trail.</p>
      </div>
    );
  }

  const renderPayload = (payload: any) => {
    if (!payload || Object.keys(payload).length === 0) return null;
    return (
      <pre className="mt-3 overflow-x-auto rounded-lg bg-black/50 p-3 text-[11px] leading-relaxed text-emerald-400/80 shadow-inner">
        {JSON.stringify(payload, null, 2)}
      </pre>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Audit Trail</h1>
        <p className="mt-2 text-sm text-slate-400">
          Immutable ledger of all critical system actions.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {logs.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
              <KeySquare className="mx-auto mb-3 h-8 w-8 text-slate-500" />
              <p className="text-sm font-medium text-slate-300">No logs found</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log._id}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5 shadow-sm transition hover:bg-white/[0.03]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-indigo-400/20 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                        {log.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-300">
                      <span className="font-semibold text-white">
                        {log.actor?.name || "System"}
                      </span>{" "}
                      <span className="text-slate-500">({log.actor?.role || "N/A"})</span>{" "}
                      performed action on{" "}
                      <span className="font-mono text-xs text-indigo-200">
                        {log.targetModel}
                      </span>
                      {log.targetId && (
                        <span className="ml-1 font-mono text-[10px] text-slate-500">
                          #{log.targetId.slice(-6)}
                        </span>
                      )}
                    </p>

                    {renderPayload(log.payload)}
                  </div>

                  <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-black/20 p-3 sm:min-w-[200px]">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{log.ipAddress}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <MonitorSmartphone className="h-3 w-3" />
                      <span className="truncate" title={log.userAgent}>
                        {log.userAgent.split(" ")[0]}...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
