import { useMemo } from 'react';
import AnalyticsHeader from '@/pages/analytics/AnalyticsHeader';
import StatCard from '@/pages/analytics/StatCard';
import DataTable from '@/pages/analytics/DataTable';
import { useManagementData } from '@/pages/analytics/useManagementData';
import {
    monthKey,
    monthLabel,
    percentageOf,
    truncateLabel,
} from '@/pages/analytics/metrics';
import Card from '@/components/dashboard/Card';
import TrendChart from '@/components/dashboard/TrendChart';
import CategoryBars from '@/components/dashboard/CategoryBars';
import { CHART_COLORS } from '@/components/charts/palette';

interface MonthRow {
    label: string;
    count: number;
    avg: number;
    passRate: number;
}

export default function ActivityAnalytics() {
    const { allScores, loading, error } = useManagementData();

    const monthly = useMemo(() => {
        const buckets = new Map<string, { label: string; sort: string; sum: number; count: number; pass: number }>();
        allScores.forEach((sc) => {
            if (!sc.created_at) return;
            const key = monthKey(sc.created_at);
            if (!key) return;
            const bucket = buckets.get(key) || {
                label: monthLabel(sc.created_at),
                sort: sc.created_at.slice(0, 7),
                sum: 0,
                count: 0,
                pass: 0,
            };
            const pct = percentageOf(sc);
            bucket.sum += pct;
            bucket.count += 1;
            if (pct >= 50) bucket.pass += 1;
            buckets.set(key, bucket);
        });
        const rows: MonthRow[] = Array.from(buckets.values())
            .map((b) => ({
                label: b.label,
                count: b.count,
                avg: b.count ? Math.round(b.sum / b.count) : 0,
                passRate: b.count ? Math.round((b.pass / b.count) * 100) : 0,
            }))
            .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
        return { trend: rows.map((r) => ({ label: r.label, value: r.avg })), counts: rows.map((r) => ({ label: r.label, value: r.count })), rows };
    }, [allScores]);

    const stats = useMemo(() => {
        const total = allScores.length;
        let obtained = 0;
        let marks = 0;
        let pass = 0;
        allScores.forEach((s) => {
            obtained += s.marks_obtained;
            marks += s.total_marks;
            if (percentageOf(s) >= 50) pass += 1;
        });
        return {
            total,
            avg: marks ? Math.round((obtained / marks) * 100) : 0,
            passRate: total ? Math.round((pass / total) * 100) : 0,
            months: monthly.rows.length,
        };
    }, [allScores, monthly]);

    if (loading) return <p className="text-sm text-muted">Loading...</p>;
    if (error) return <p className="text-sm text-danger">{error}</p>;

    return (
        <div className="min-w-0 space-y-6">
            <AnalyticsHeader
                backTo="/management/dashboard"
                title="School Activity in Detail"
                subtitle="Average scores and assessment volume across every class and subject."
            />

            <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-4">
                <StatCard label="Total Assessments" value={stats.total} color={CHART_COLORS.gold} />
                <StatCard label="Overall Average" value={`${stats.avg}%`} color={CHART_COLORS.blue} />
                <StatCard label="Pass Rate" value={`${stats.passRate}%`} color={CHART_COLORS.success} />
                <StatCard label="Months Tracked" value={stats.months} color={CHART_COLORS.warning} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
                <Card title="Average Score per Month" subtitle="Mean percentage across all assessments" pad={false}>
                    <div className="min-w-0 p-4 sm:p-5">
                        {monthly.trend.length === 0 ? (
                            <p className="py-12 text-center text-sm text-muted">No scores recorded yet.</p>
                        ) : (
                            <TrendChart data={monthly.trend} height={260} maxLabel={0} />
                        )}
                    </div>
                </Card>

                <Card title="Assessments per Month" subtitle="Volume of marks recorded" pad={false}>
                    <div className="min-w-0 p-4 sm:p-5">
                        {monthly.counts.length === 0 ? (
                            <p className="py-12 text-center text-sm text-muted">No scores recorded yet.</p>
                        ) : (
                            <CategoryBars
                                data={monthly.counts}
                                height={260}
                                categoryWidth={64}
                                domain={[0, 'auto']}
                            />
                        )}
                    </div>
                </Card>
            </div>

            <Card title="Month-by-Month Breakdown" subtitle="How the school performed over time" pad={false}>
                <div className="p-4 sm:p-5">
                    <DataTable<MonthRow>
                        data={monthly.rows}
                        keyFor={(r) => r.label}
                        empty="No scores recorded yet."
                        columns={[
                            { header: 'Month', render: (r) => <span className="font-medium text-ink2">{truncateLabel(r.label)}</span> },
                            { header: 'Assessments', render: (r) => r.count },
                            {
                                header: 'Average Score',
                                className: 'text-right',
                                render: (r) => (
                                    <span className="font-semibold" style={{ color: CHART_COLORS.blue }}>
                                        {r.avg}%
                                    </span>
                                ),
                            },
                            {
                                header: 'Pass Rate',
                                className: 'text-right',
                                render: (r) => (
                                    <span className={`font-semibold ${r.passRate >= 50 ? 'text-success' : 'text-danger'}`}>
                                        {r.passRate}%
                                    </span>
                                ),
                            },
                        ]}
                    />
                </div>
            </Card>
        </div>
    );
}