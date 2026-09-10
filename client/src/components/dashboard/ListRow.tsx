import type { ReactNode } from 'react';
import { BENTO_RADIUS } from '@/components/charts/palette';

export default function ListRow({
    icon,
    iconBg = 'bg-ink/10',
    iconColor = 'text-ink',
    title,
    subtitle,
    action,
    trailing,
}: {
    icon: ReactNode;
    iconBg?: string;
    iconColor?: string;
    title: ReactNode;
    subtitle?: ReactNode;
    action?: ReactNode;
    trailing?: ReactNode;
}) {
    return (
        <div
            className="flex items-center gap-4 border border-border bg-surface px-5 py-4 transition hover:shadow-sm"
            style={{ borderRadius: BENTO_RADIUS }}
        >
            <span
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
            >
                {icon}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink2">{title}</span>
                {subtitle && (
                    <span className="block truncate text-xs text-muted">{subtitle}</span>
                )}
            </span>
            {trailing && <span className="data-figure text-sm font-semibold text-ink2">{trailing}</span>}
            {action}
        </div>
    );
}