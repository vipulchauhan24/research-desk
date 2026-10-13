import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  // Optional action, e.g. an "Add company" button. Omit on read-only (mobile) views.
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
      <div className="font-medium text-slate-900">{title}</div>
      {description && <div className="text-slate-500">{description}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
