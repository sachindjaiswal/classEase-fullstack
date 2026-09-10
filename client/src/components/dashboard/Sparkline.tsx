import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { CHART_COLORS, TEAL_GRADIENT } from '@/components/charts/palette';

export default function Sparkline({
    data,
    dataKey = 'value',
    height = 56,
    color = TEAL_GRADIENT.from,
    strokeWidth = 2.5,
}: {
    data: Array<{ label: string; value: number }>;
    dataKey?: string;
    height?: number;
    color?: string;
    strokeWidth?: number;
}) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <Area
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="url(#sparkFill)"
                    dot={false}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}