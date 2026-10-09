import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    AXIS_TICK,
    CHART_COLORS,
    CURSOR_LINE,
    GRID_STROKE,
} from '@/components/charts/palette';
import ChartTooltip from '@/components/charts/ChartTooltip';

export interface TrendPoint {
    label: string;
    value: number;
    [key: string]: string | number;
}

export default function TrendChart({
    data,
    dataKey = 'value',
    height = 230,
    color = CHART_COLORS.ink,
    name = 'value',
    maxLabel,
    unit = '%',
}: {
    data: TrendPoint[];
    dataKey?: string;
    height?: number;
    color?: string;
    name?: string;
    maxLabel?: number;
    unit?: string;
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

    const gradId = `trend-${color.replace('#', '')}-${dataKey}`;
    const points = data.length === 1 ? [...data, data[0]] : data;
    const showDots = points.length <= 12;

    return (
        <ResponsiveContainer width="100%" height={height} minHeight={height}>
            <AreaChart data={points} margin={{ top: 12, right: 14, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.24} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.01} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke={GRID_STROKE} vertical={false} />
                <XAxis
                    dataKey="label"
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    interval="preserveStartEnd"
                    minTickGap={typeof maxLabel === 'number' && maxLabel > 0 ? maxLabel : 16}
                />
                <YAxis
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    tickMargin={6}
                    allowDecimals={false}
                    domain={[0, 'auto']}
                />
                <Tooltip
                    content={<ChartTooltip unit={unit} />}
                    cursor={CURSOR_LINE}
                />
                <Area
                    type="monotone"
                    dataKey={dataKey}
                    name={name}
                    stroke={color}
                    strokeWidth={2.5}
                    fill={`url(#${gradId})`}
                    dot={showDots ? { r: 3, fill: color, strokeWidth: 0 } : false}
                    activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                    isAnimationActive={false}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
