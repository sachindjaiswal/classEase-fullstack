import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_COLORS, fmt, TOOLTIP_STYLE } from '@/components/charts/palette';

export interface DonutSlice {
    name: string;
    value: number;
}

export default function PassDonut({
    data,
    centerLabel,
    centerSub = 'Overall',
    height = 220,
    colors = [CHART_COLORS.success, CHART_COLORS.danger],
}: {
    data: DonutSlice[];
    centerLabel?: string;
    centerSub?: string;
    height?: number;
    colors?: string[];
}) {
    return (
        <div className="relative" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        labelStyle={{ color: CHART_COLORS.ink2, fontWeight: 600 }}
                        formatter={(value) => fmt(Number(value), '%')}
                    />
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="68%"
                        outerRadius="92%"
                        paddingAngle={3}
                        strokeWidth={0}
                    >
                        {data.map((entry) => (
                            <Cell key={entry.name} fill={colors[data.indexOf(entry) % colors.length]} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            {centerLabel !== undefined && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="data-figure font-display text-3xl font-semibold text-ink2">
                        {centerLabel}
                    </span>
                    <span className="text-xs uppercase tracking-wide text-muted">{centerSub}</span>
                </div>
            )}
        </div>
    );
}