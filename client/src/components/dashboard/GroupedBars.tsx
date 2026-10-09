import { memo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AXIS_TICK, CHART_COLORS, CURSOR_BAR, GRID_STROKE } from '@/components/charts/palette';
import ChartTooltip from '@/components/charts/ChartTooltip';

export interface SeriesDef {
    key: string;
    color: string;
}

function GroupedBars({
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

    return (
        <div className="min-w-0" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={height}>
                <BarChart
                    data={data}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    barGap={4}
                    barCategoryGap="24%"
                >
                    <CartesianGrid strokeDasharray="4 4" stroke={GRID_STROKE} vertical={false} />
                    <XAxis
                        dataKey="label"
                        tick={{ ...AXIS_TICK, fill: CHART_COLORS.ink2 }}
                        tickFormatter={(v: string) => (v.length > 14 ? `${v.slice(0, 13)}…` : v)}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={8}
                        interval="preserveStartEnd"
                        minTickGap={8}
                    />
                    <YAxis
                        domain={[0, 100]}
                        tick={AXIS_TICK}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                        tickMargin={6}
                        allowDecimals={false}
                    />
                    <Tooltip content={<ChartTooltip unit={unit} />} cursor={CURSOR_BAR} />
                    <Legend
                        wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                        iconType="circle"
                        iconSize={8}
                    />
                    {series.map((s) => (
                        <Bar
                            key={s.key}
                            dataKey={s.key}
                            name={s.key}
                            fill={s.color}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={18}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default memo(GroupedBars);
