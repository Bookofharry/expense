type Variant =
  | "pending"
  | "approved"
  | "rejected"
  | "low"
  | "medium"
  | "high"
  | "urgent"
  | "upcoming"
  | "ongoing"
  | "confirmed"
  | "attended"
  | "default";

const variantStyles: Record<Variant, string> = {
  pending: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  approved: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  rejected: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  low: "border-slate-400/25 bg-slate-400/10 text-slate-300",
  medium: "border-blue-400/25 bg-blue-400/10 text-blue-300",
  high: "border-orange-400/25 bg-orange-400/10 text-orange-300",
  urgent: "border-red-400/25 bg-red-400/10 text-red-300",
  upcoming: "border-indigo-400/25 bg-indigo-400/10 text-indigo-300",
  ongoing: "border-teal-400/25 bg-teal-400/10 text-teal-300",
  confirmed: "border-blue-400/25 bg-blue-400/10 text-blue-300",
  attended: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  default: "border-slate-400/25 bg-slate-400/10 text-slate-300",
};

interface StatusBadgeProps {
  label: string;
  variant?: Variant;
}

export function StatusBadge({ label, variant = "default" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${variantStyles[variant]}`}
    >
      {label}
    </span>
  );
}

export function getStatusVariant(status: string): Variant {
  const map: Record<string, Variant> = {
    Pending: "pending",
    Approved: "approved",
    Rejected: "rejected",
  };
  return map[status] ?? "default";
}

export function getPriorityVariant(priority: string): Variant {
  const map: Record<string, Variant> = {
    Low: "low",
    Medium: "medium",
    High: "high",
    Urgent: "urgent",
  };
  return map[priority] ?? "default";
}

export function getEventStatusVariant(status: string): Variant {
  const map: Record<string, Variant> = {
    Upcoming: "upcoming",
    Ongoing: "ongoing",
    Completed: "low",
    Cancelled: "rejected",
  };
  return map[status] ?? "default";
}

export function getRegistrationStatusVariant(status: string): Variant {
  const map: Record<string, Variant> = {
    Pending: "pending",
    Confirmed: "confirmed",
    Attended: "attended",
    Cancelled: "rejected",
  };
  return map[status] ?? "default";
}

export function getWorkspaceStatusVariant(status: string): Variant {
  const map: Record<string, Variant> = {
    Active: "approved",
    "Expiring Soon": "pending",
    Expired: "rejected",
    Inactive: "low",
  };
  return map[status] ?? "default";
}
