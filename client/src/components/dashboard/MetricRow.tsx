import type { ReactNode } from 'react';

export default function MetricRow({
    icon,
    label,
    value,
    hint,
    iconBg = 'bg-ink/10',
    iconColor = 'text-ink',
}: {
    icon: ReactNode;
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    iconBg?: string;
    iconColor?: string;
}) {
    return (
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
            <span
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
            >
                {icon}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-xs text-muted">{label}</span>
                <span className="data-figure block font-display text-2xl font-semibold text-ink2">
                    {value}
                </span>
            </span>
            {hint && <span className="text-xs text-muted">{hint}</span>}
        </div>
    );
}
