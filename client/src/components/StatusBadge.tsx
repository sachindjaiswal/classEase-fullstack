import type { ReactNode } from 'react';

type Status = 'success' | 'danger' | 'warning' | 'neutral';

const STYLES: Record<Status, string> = {
  success: 'bg-success/10 text-success ring-success/20',
  danger: 'bg-danger/10 text-danger ring-danger/20',
  warning: 'bg-warning/10 text-warning ring-warning/25',
  neutral: 'bg-muted/10 text-muted ring-muted/20',
};

export default function StatusBadge({
  status,
  children,
}: {
  status: Status;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}
