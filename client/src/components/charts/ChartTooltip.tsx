import { CHART_COLORS } from '@/components/charts/palette';

export interface TooltipItem {
    name?: string | number;
    value?: string | number;
    color?: string;
    fill?: string;
    dataKey?: string;
    payload?: { color?: string; fill?: string };
}

export default function ChartTooltip({
    active,
    payload,
    label,
    unit = '',
    valueFormatter,
    nameFormatter,
}: {
    active?: boolean;
    payload?: TooltipItem[];
    label?: string | number;
    unit?: string;
    valueFormatter?: (value: number) => string;
    nameFormatter?: (name: string) => string;
}) {
    if (!active || !payload || payload.length === 0) return null;

    const heading = typeof label === 'string' && label.length > 0 ? label : undefined;

    return (
        <div className="min-w-[7.5rem] rounded-xl border border-border bg-surface/95 px-3 py-2 shadow-pop backdrop-blur-sm">
            {heading && (
                <p className="mb-1.5 font-display text-xs font-semibold text-ink2">{heading}</p>
            )}
            <div className="flex flex-col gap-1">
                {payload.map((item, i) => {
                    const raw = Number(item.value);
                    const value = valueFormatter
                        ? valueFormatter(raw)
                        : Number.isFinite(raw)
                          ? `${Math.round(raw)}${unit}`
                          : '—';
                    const name = nameFormatter
                        ? nameFormatter(String(item.name ?? ''))
                        : String(item.name ?? '');
                    const color =
                        item.color || item.fill || item.payload?.fill || CHART_COLORS.ink;
                    return (
                        <div key={i} className="flex items-center gap-2 text-xs">
                            <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ background: color }}
                            />
                            {name && <span className="text-muted">{name}</span>}
                            <span className="data-figure ml-auto font-semibold text-ink2">
                                {value}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
