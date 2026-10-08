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
    fmt,
    TOOLTIP_STYLE,
} from '@/components/charts/palette';

export interface TrendPoint {
    label: string;
    value: number;
    [key: string]: string | number;
}

export default function TrendChart({
    data,
    dataKey = 'value',
    height = 230,
    color = CHART_COLORS.blue,
    name = 'value',
    maxLabel,
}: {
    data: TrendPoint[];
    dataKey?: string;
    height?: number;
    color?: string;
    name?: string;
    maxLabel?: number;
}) {
    const gradId = `trendFill${color.replace('#', '')}`;
    const points = data.length === 1 ? [...data, data[0]] : data;

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
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={points} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.border} vertical={false} />
                <XAxis
                    dataKey="label"
                    tick={AXIS_TICK}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={typeof maxLabel === 'number' && maxLabel > 0 ? maxLabel : 16}
                />
                <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={36} />
                <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle={{ color: CHART_COLORS.ink2, fontWeight: 600 }}
                    formatter={(value) => fmt(Number(value), '%')}
                />
                <Area
                    type="monotone"
                    dataKey={dataKey}
                    name={name}
                    stroke={color}
                    strokeWidth={2.5}
                    fill={`url(#${gradId})`}
                    dot={{ r: 3, fill: color, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}