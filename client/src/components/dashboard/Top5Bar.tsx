import {
    Cell,
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { ACCENT_SEQUENCE, AXIS_TICK, CHART_COLORS, fmt, TOOLTIP_STYLE } from '@/components/charts/palette';

export interface Top5Row {
    label: string;
    value: number;
}

function truncateLabel(value: string, max = 14): string {
    return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export default function Top5Bar({
    data,
    height = 180,
    unit = '',
    width = 84,
}: {
    data: Top5Row[];
    height?: number;
    unit?: string;
    width?: number;
}) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ ...AXIS_TICK, fill: CHART_COLORS.ink2 }}
                    tickFormatter={truncateLabel}
                    axisLine={false}
                    tickLine={false}
                    width={width}
                />
                <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle={{ color: CHART_COLORS.ink2, fontWeight: 600 }}
                    formatter={(value) => fmt(Number(value), unit)}
                />
                <Bar dataKey="value" radius={[4, 8, 8, 4]} maxBarSize={12}>
                    {data.map((entry) => (
                        <Cell key={entry.label} fill={ACCENT_SEQUENCE[data.indexOf(entry) % ACCENT_SEQUENCE.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}