import type { ReactNode } from 'react';

export default function ChartCard({
    title,
    subtitle,
    right,
    children,
    className = '',
}: {
    title: string;
    subtitle?: string;
    right?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={`rounded-xl border border-border bg-surface p-5 shadow-sm ${className}`}>
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h3 className="font-display text-sm font-semibold text-ink2">{title}</h3>
                    {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
                </div>
                    {right}
            </div>
            {children}
        </div>
    );
}
