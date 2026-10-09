import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
    AXIS_TICK,
    BAR_TRACK,
    CHART_COLORS,
    CURSOR_BAR,
    GRID_STROKE,
} from '@/components/charts/palette';
import ChartTooltip from '@/components/charts/ChartTooltip';

export interface CategoryRow {
    label: string;
    value: number;
}

export default function CategoryBars({
    data,
    height = 220,
    unit = '',
    categoryWidth = 72,
    color = CHART_COLORS.ink,
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
    if (data.length === 0) {
        return (
            <div
                className="flex items-center justify-center text-sm text-muted"
                style={{ height }}
            >
                No data yet.
            </div>
        );
    }

    const resolved = domain ?? [0, maxY];
    const longest = data.reduce((m, d) => Math.max(m, d.label.length), 0);
    const yWidth = Math.min(168, Math.max(categoryWidth, Math.round(longest * 6.4) + 16));

    return (
        <div className="min-w-0" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={height}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 4, right: 14, left: 0, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="4 4" stroke={GRID_STROKE} horizontal={false} />
                    <XAxis
                        type="number"
                        domain={resolved}
                        tick={AXIS_TICK}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={6}
                    />
                    <YAxis
                        type="category"
                        dataKey="label"
                        tick={{ ...AXIS_TICK, fill: CHART_COLORS.ink2 }}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={8}
                        width={yWidth}
                    />
                    <Tooltip content={<ChartTooltip unit={unit} />} cursor={CURSOR_BAR} />
                    <Bar
                        dataKey="value"
                        name="value"
                        fill={color}
                        radius={[0, 6, 6, 0]}
                        maxBarSize={16}
                        background={{ fill: BAR_TRACK, radius: 6 }}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
