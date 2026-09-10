import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS_TICK, CHART_COLORS, fmt, TOOLTIP_STYLE } from '@/components/charts/palette';

export interface SeriesDef {
    key: string;
    color: string;
}

export default function GroupedBars({
    data,
    series,
    height = 240,
    unit = '',
    categoryWidth = 44,
}: {
    data: Array<Record<string, number | string | null>>;
    series: SeriesDef[];
    height?: number;
    unit?: string;
    categoryWidth?: number;
}) {
    return (
        <div className="min-w-0" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} />
                    <XAxis
                        dataKey="label"
                        tick={{ ...AXIS_TICK, fill: CHART_COLORS.ink2 }}
                        tickFormatter={(v: string) => (v.length > 10 ? `${v.slice(0, 9)}…` : v)}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                        minTickGap={8}
                    />
                    <YAxis domain={[0, 100]} tick={AXIS_TICK} axisLine={false} tickLine={false} width={36} />
                    <Tooltip
                        cursor={{ fill: 'rgba(30,42,74,0.04)' }}
                        contentStyle={TOOLTIP_STYLE}
                        labelStyle={{ color: CHART_COLORS.ink2, fontWeight: 600 }}
                        formatter={(value) => fmt(Number(value), unit)}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {series.map((s) => (
                        <Bar key={s.key} dataKey={s.key} name={s.key} fill={s.color} radius={[4, 4, 0, 0]} barSize={12} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}