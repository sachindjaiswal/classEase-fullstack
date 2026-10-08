import type { ReactNode } from 'react';
import { BENTO_RADIUS } from '@/components/charts/palette';

export default function Card({
    title,
    subtitle,
    action,
    children,
    className = '',
    bodyClassName = '',
    pad = true,
}: {
    title?: ReactNode;
    subtitle?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    bodyClassName?: string;
    pad?: boolean;
}) {
    return (
        <section
            className={`flex min-w-0 flex-col border border-border bg-surface shadow-sm ${className}`}
            style={{ borderRadius: BENTO_RADIUS, overflow: 'hidden' }}
        >
            {(title || action) && (
                <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-4 sm:px-6 sm:pt-5">
                    <div className="min-w-0">
                        {title && <h3 className="truncate font-display text-base font-semibold text-ink2">{title}</h3>}
                        {subtitle && <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>}
                    </div>
                    {action && <div className="shrink-0">{action}</div>}
                </header>
            )}
            <div className={`min-w-0 flex-1 ${pad ? 'p-5 sm:p-6' : bodyClassName}`}>{children}</div>
        </section>
    );
}