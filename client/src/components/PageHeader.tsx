import type { ReactNode } from 'react';

export default function PageHeader({
    title,
    subtitle,
    eyebrow,
    actions,
}: {
    title: ReactNode;
    subtitle?: ReactNode;
    eyebrow?: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
                {eyebrow && (
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold-dark">
                        {eyebrow}
                    </p>
                )}
                <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-ink2 sm:text-[1.75rem]">
                    {title}
                </h1>
                {subtitle && (
                    <p className="mt-1.5 max-w-2xl text-sm text-muted">{subtitle}</p>
                )}
            </div>
            {actions && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
            )}
        </div>
    );
}
