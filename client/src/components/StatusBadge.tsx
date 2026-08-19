import type { ReactNode } from 'react';

type Status = 'success' | 'danger' | 'warning' | 'neutral';

const STYLES: Record<Status, string> = {
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
  neutral: 'bg-muted/10 text-muted',
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {children}
    </span>
  );
}
