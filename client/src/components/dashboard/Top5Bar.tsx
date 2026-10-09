import { memo } from 'react';
import { Cell, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
    ACCENT_SEQUENCE,
    AXIS_TICK,
    BAR_TRACK,
    CHART_COLORS,
    CURSOR_BAR,
} from '@/components/charts/palette';
import ChartTooltip from '@/components/charts/ChartTooltip';

export interface Top5Row {
    label: string;
    value: number;
}

function Top5Bar({
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

    const domain: [number, number | string] = unit === '%' ? [0, 100] : [0, 'auto'];
    const longest = data.reduce((m, d) => Math.max(m, d.label.length), 0);
    const yWidth = Math.min(180, Math.max(width, Math.round(longest * 6.4) + 16));

    return (
        <ResponsiveContainer width="100%" height={height} minHeight={height}>
            <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 0, bottom: 0 }}
            >
                <XAxis
                    type="number"
                    domain={domain}
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={6}
                    allowDecimals={false}
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
                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={16} background={{ fill: BAR_TRACK, radius: 6 }}>
                    {data.map((entry, i) => (
                        <Cell
                            key={`${entry.label}-${i}`}
                            fill={ACCENT_SEQUENCE[i % ACCENT_SEQUENCE.length]}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

export default memo(Top5Bar);
