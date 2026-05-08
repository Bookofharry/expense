import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
        {icon ?? <Inbox className="h-6 w-6 text-slate-400" />}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        ) : null}
      </div>
      {action ?? null}
    </div>
  );
}
