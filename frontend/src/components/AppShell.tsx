import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Banknote,
  ClipboardList,
  LogOut,
  Menu,
  Users,
  X,
  LayoutDashboard,
  Shield,
} from "lucide-react";

import { useAuth } from "../lib/AuthContext";
import { getInitials } from "../lib/format";

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Income", to: "/income", icon: Banknote },
  { label: "Budgets", to: "/budgets", icon: ClipboardList },
  { label: "Staff", to: "/staff", icon: Users, adminOnly: true },
  { label: "Audit Logs", to: "/audit", icon: Shield, adminOnly: true },
];

export function AppShell() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setIsMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const visibleNavItems = navItems.filter(
    (item) => !item.adminOnly || role === "Admin"
  );

  const roleBadgeColor =
    role === "Admin"
      ? "border-violet-400/30 bg-violet-500/10 text-violet-300"
      : role === "Clerk"
      ? "border-blue-400/30 bg-blue-500/10 text-blue-300"
      : "border-teal-400/30 bg-teal-500/10 text-teal-300";

  return (
    <div className="flex min-h-screen bg-black">
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden ${
          isMobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-white/8 bg-[#060610]/95 px-4 py-5 backdrop-blur-xl transition-transform lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-white/8 pb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-indigo-400/70">
              TechMinds Academy
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              Command Center
            </h2>
          </div>
          <button
            type="button"
            className="icon-button lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="mt-6 flex-1 space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "border border-indigo-500/25 bg-indigo-500/10 text-white"
                      : "border border-transparent text-slate-400 hover:border-white/8 hover:bg-white/[0.04] hover:text-white"
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0 text-indigo-400" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User panel */}
        <div className="space-y-3 border-t border-white/8 pt-4">
          <div className="glass-subpanel p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white">
                {getInitials(user?.name ?? "U")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {user?.name ?? "User"}
                </p>
                <span className={`mt-0.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${roleBadgeColor}`}>
                  {role}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Spacer for sidebar on desktop */}
      <div className="hidden w-[260px] shrink-0 lg:block" />

      {/* Main content */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-white/8 bg-black/80 px-4 py-4 backdrop-blur-xl lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center gap-4">
            <button
              type="button"
              className="icon-button lg:hidden"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-400" />
              <span className="text-sm text-slate-400">
                {new Date().toLocaleDateString("en-NG", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
