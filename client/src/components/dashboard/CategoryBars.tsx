import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { AXIS_TICK, CHART_COLORS, fmt, TOOLTIP_STYLE } from '@/components/charts/palette';

export interface CategoryRow {
    label: string;
    value: number;
}

function truncateLabel(value: string, max = 12): string {
    return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export default function CategoryBars({
    data,
    height = 220,
    unit = '',
    categoryWidth = 72,
    color = CHART_COLORS.blue,
    domain,
    maxY = 100,
}: {
    data: CategoryRow[];
    height?: number;
    unit?: string;
    categoryWidth?: number;
    color?: string;
    domain?: [number | string, number | string];
    maxY?: number;
}) {
    const resolved = domain ?? [0, maxY];
    return (
        <div className="min-w-0" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} horizontal={false} />
                    <XAxis type="number" domain={resolved} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                    <YAxis
                        type="category"
                        dataKey="label"
                        tick={{ ...AXIS_TICK, fill: CHART_COLORS.ink2 }}
                        tickFormatter={truncateLabel}
                        axisLine={false}
                        tickLine={false}
                        width={categoryWidth}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(30,42,74,0.04)' }}
                        contentStyle={TOOLTIP_STYLE}
                        labelStyle={{ color: CHART_COLORS.ink2, fontWeight: 600 }}
                        formatter={(value) => fmt(Number(value), unit)}
                    />
                    <Bar dataKey="value" name="value" fill={color} radius={[4, 8, 8, 4]} maxBarSize={16} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}