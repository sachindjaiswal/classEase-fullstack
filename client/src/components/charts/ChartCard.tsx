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
        <div className={`card p-5 ${className}`}>
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="font-display text-base font-semibold text-ink2">{title}</h3>
                    {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
                </div>
                {right}
            </div>
            {children}
        </div>
    );
}
