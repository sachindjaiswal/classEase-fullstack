import type { ReactNode } from 'react';
import { BENTO_RADIUS, CHART_COLORS, INK_GRADIENT } from '@/components/charts/palette';

export default function HeroBanner({
    title,
    subtitle,
    children,
}: {
    title: ReactNode;
    subtitle?: string;
    children?: ReactNode;
}) {
    return (
        <div
            className="relative flex flex-col justify-between gap-6 overflow-hidden p-6 text-white sm:flex-row sm:items-center sm:p-8"
            style={{
                borderRadius: BENTO_RADIUS,
                background: `linear-gradient(120deg, ${INK_GRADIENT.from} 0%, ${INK_GRADIENT.to} 100%)`,
            }}
        >
            <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -right-4 -bottom-20 h-64 w-64 rounded-full bg-white/5" />
            <div className="relative z-10">
                <h2 className="font-display text-2xl font-bold sm:text-3xl">{title}</h2>
                {subtitle && <p className="mt-1 text-sm text-white/80">{subtitle}</p>}
            </div>
            {children && (
                <div className="relative z-10 flex flex-wrap items-center gap-3">{children}</div>
            )}
        </div>
    );
}

export function KpiBadge({
    icon,
    label,
    value,
    onClick,
    accent = CHART_COLORS.gold,
}: {
    icon: ReactNode;
    label: string;
    value: ReactNode;
    onClick?: () => void;
    accent?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-3 rounded-xl bg-white/15 px-4 py-3 text-left ring-1 ring-white/25 backdrop-blur transition hover:bg-white/25"
        >
            <span
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white"
                style={{ color: accent }}
            >
                {icon}
            </span>
            <span>
                <span className="block font-display text-lg font-bold leading-tight">{value}</span>
                <span className="block text-xs text-white/80">{label}</span>
            </span>
        </button>
    );
}
