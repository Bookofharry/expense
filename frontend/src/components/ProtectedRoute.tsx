import { Navigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

import { useAuth } from "../lib/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && role !== "Admin") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-500/10">
          <ShieldAlert className="h-7 w-7 text-rose-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">Admin access required</h2>
        <p className="max-w-sm text-sm text-slate-400">
          This section is only available to administrators.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
