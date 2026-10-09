import { memo, useId } from 'react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import { TEAL_GRADIENT } from '@/components/charts/palette';

function Sparkline({
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
    const reactId = useId().replace(/:/g, '');
    const gradId = `spark-${reactId}`;

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
        <ResponsiveContainer width="100%" height={height} minHeight={height}>
            <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.32} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <YAxis
                    hide
                    domain={[
                        (dataMin: number) => dataMin - Math.max(1, dataMin * 0.08),
                        (dataMax: number) => dataMax + Math.max(1, dataMax * 0.08),
                    ]}
                />
                <Area
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill={`url(#${gradId})`}
                    dot={false}
                    isAnimationActive={false}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export default memo(Sparkline);
