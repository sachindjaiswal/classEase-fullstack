import type { ReactNode } from 'react';
import { BENTO_RADIUS } from '@/components/charts/palette';

export default function StatCard({
    label,
    value,
    sub,
    color,
    icon,
}: {
    label: string;
    value: ReactNode;
    sub?: string;
    color: string;
    icon?: ReactNode;
}) {
    return (
        <div
            className="flex flex-col gap-1 border border-border bg-surface px-5 py-4 shadow-sm"
            style={{ borderRadius: BENTO_RADIUS }}
        >
            <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
                <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
                {icon && <span className="ml-auto">{icon}</span>}
            </div>
            <p className="font-display text-2xl font-bold text-ink2">{value}</p>
            {sub && <p className="text-xs text-muted">{sub}</p>}
        </div>
    );
}