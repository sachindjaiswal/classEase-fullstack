import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function AnalyticsHeader({
    backTo,
    title,
    subtitle,
    children,
}: {
    backTo: string;
    title: string;
    subtitle?: string;
    children?: ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
                <Link
                    to={backTo}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-ink2 hover:text-gold"
                >
                    ← Back to dashboard
                </Link>
                <h1 className="mt-1 font-display text-2xl font-bold text-ink">{title}</h1>
                {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
            </div>
            {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
        </div>
    );
}