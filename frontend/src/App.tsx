import { Navigate, Route, Routes } from "react-router-dom";

import { AuthScreen } from "./components/AuthScreen";
import { AppShell } from "./components/AppShell";
import { DashboardScreen } from "./components/DashboardScreen";
import { IncomeScreen } from "./components/IncomeScreen";
import { BudgetsScreen } from "./components/BudgetsScreen";
import { StaffScreen } from "./components/StaffScreen";
import { AuditScreen } from "./components/AuditScreen";
import { PayrollScreen } from "./components/PayrollScreen";
import { EventsScreen } from "./components/EventsScreen";
import { WorkspaceScreen } from "./components/WorkspaceScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { ProtectedRoute } from "./components/ProtectedRoute";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthScreen />} />

      {/* Protected app routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/income" element={<IncomeScreen />} />
        <Route path="/budgets" element={<BudgetsScreen />} />
        <Route
          path="/staff"
          element={
            <ProtectedRoute adminOnly>
              <StaffScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payroll"
          element={
            <ProtectedRoute adminOnly>
              <PayrollScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute adminOnly>
              <EventsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedRoute adminOnly>
              <AuditScreen />
            </ProtectedRoute>
          }
        />
        {/* Workspace: visible to Clerk + Admin (nav handles visibility; route is open to all auth) */}
        <Route path="/workspace" element={<WorkspaceScreen />} />
        <Route
          path="/settings"
          element={
            <ProtectedRoute adminOnly>
              <SettingsScreen />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
