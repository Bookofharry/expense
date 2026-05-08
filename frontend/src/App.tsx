import { Navigate, Route, Routes } from "react-router-dom";

import { AuthScreen } from "./components/AuthScreen";
import { AppShell } from "./components/AppShell";
import { DashboardScreen } from "./components/DashboardScreen";
import { IncomeScreen } from "./components/IncomeScreen";
import { BudgetsScreen } from "./components/BudgetsScreen";
import { StaffScreen } from "./components/StaffScreen";
import { AuditScreen } from "./components/AuditScreen";
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
          path="/audit"
          element={
            <ProtectedRoute adminOnly>
              <AuditScreen />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
