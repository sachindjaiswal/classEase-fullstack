import type { ReactNode } from 'react';

export default function EmptyState({
    title,
    message,
    icon,
    action,
}: {
    title: string;
    message?: string;
    icon?: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface/60 px-6 py-12 text-center">
            {icon && (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-50 text-ink/60">
                    {icon}
                </span>
            )}
            <div>
                <p className="font-display text-base font-semibold text-ink2">{title}</p>
                {message && <p className="mt-1 text-sm text-muted">{message}</p>}
            </div>
            {action}
        </div>
    );
}
