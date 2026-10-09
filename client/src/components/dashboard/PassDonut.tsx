import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_COLORS } from '@/components/charts/palette';
import ChartTooltip from '@/components/charts/ChartTooltip';

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
    const total = data.reduce((sum, slice) => sum + (Number(slice.value) || 0), 0);

    return (
        <div className="relative" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={height}>
                <PieChart>
                    <Tooltip
                        content={
                            <ChartTooltip
                                valueFormatter={(v) =>
                                    total > 0 ? `${v} · ${Math.round((v / total) * 100)}%` : String(v)
                                }
                            />
                        }
                    />
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        startAngle={90}
                        endAngle={-270}
                        innerRadius="68%"
                        outerRadius="92%"
                        paddingAngle={2}
                        cornerRadius={6}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                    >
                        {data.map((entry, i) => (
                            <Cell key={`${entry.name}-${i}`} fill={colors[i % colors.length]} />
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
