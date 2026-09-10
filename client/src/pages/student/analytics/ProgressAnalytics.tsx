import { useEffect, useMemo, useState } from 'react';
import AnalyticsHeader from '@/pages/analytics/AnalyticsHeader';
import StatCard from '@/pages/analytics/StatCard';
import DataTable from '@/pages/analytics/DataTable';
import { useStudentData } from '@/pages/analytics/useStudentData';
import { truncateLabel } from '@/pages/analytics/metrics';
import { getStudentProgress } from '@/api/comparison';
import Card from '@/components/dashboard/Card';
import GroupedBars from '@/components/dashboard/GroupedBars';
import { CHART_COLORS } from '@/components/charts/palette';
import type { ProgressEntry } from '@/types';

export default function StudentProgressAnalytics() {
    const { student, loading: studentLoading, error: studentError } = useStudentData();
    const [progress, setProgress] = useState<ProgressEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!student) return;
        let cancelled = false;
        setLoading(true);
        getStudentProgress(student.id)
            .then((r) => {
                if (!cancelled) setProgress(r.data.progress ?? []);
            })
            .catch(() => {
                if (!cancelled) setProgress([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [student]);

    const chartData = useMemo(
        () =>
            progress.map((p) => ({
                label: p.subject.subjectName,
                Previous: p.previous_percentage == null ? null : Math.round(p.previous_percentage),
                Current: p.current_percentage == null ? null : Math.round(p.current_percentage),
            })),
        [progress],
    );

    const stats = useMemo(() => {
        let improved = 0;
        let declined = 0;
        let same = 0;
        let delta = 0;
        let seen = false;
        progress.forEach((p) => {
            if (p.trend === 'up') improved += 1;
            else if (p.trend === 'down') declined += 1;
            else if (p.trend === 'same') same += 1;
            if (p.delta != null) {
                delta += p.delta;
                seen = true;
            }
        });
        return {
            improved,
            declined,
            same,
            overall: seen ? Math.round(delta) : null,
            subjects: progress.length,
        };
    }, [progress]);

    if (studentLoading) return <p className="text-sm text-muted">Loading...</p>;
    if (studentError) return <p className="text-sm text-danger">{studentError}</p>;

    return (
        <div className="min-w-0 space-y-6">
            <AnalyticsHeader
                backTo="/student/dashboard"
                title="Progress in Detail"
                subtitle="Current vs previous semester average percentage for each subject."
            />

            <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-4">
                <StatCard label="Improved" value={stats.improved} color={CHART_COLORS.success} />
                <StatCard label="Declined" value={stats.declined} color={CHART_COLORS.danger} />
                <StatCard label="Held Steady" value={stats.same} color={CHART_COLORS.warning} />
                <StatCard
                    label="Overall Change"
                    value={stats.overall == null ? '—' : `${stats.overall >= 0 ? '+' : ''}${stats.overall}%`}
                    color={stats.overall == null ? CHART_COLORS.muted : stats.overall >= 0 ? CHART_COLORS.success : CHART_COLORS.danger}
                />
            </div>

            <Card title="Semester Comparison" subtitle="Previous vs current average per subject" pad={false}>
                <div className="min-w-0 p-4 sm:p-5">
                    {loading ? (
                        <p className="py-12 text-center text-sm text-muted">Loading progress...</p>
                    ) : chartData.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted">
                            Progress appears when you have marks in two semesters.
                        </p>
                    ) : (
                        <GroupedBars
                            data={chartData}
                            height={Math.min(360, Math.max(240, chartData.length * 44))}
                            unit="%"
                            series={[
                                { key: 'Previous', color: CHART_COLORS.muted },
                                { key: 'Current', color: CHART_COLORS.success },
                            ]}
                        />
                    )}
                </div>
            </Card>

            <Card title="Subject-by-Subject Progress" subtitle="Exact deltas per subject" pad={false}>
                <div className="p-4 sm:p-5">
                    <DataTable<ProgressEntry>
                        data={progress}
                        keyFor={(r) => r.subject.id}
                        empty="Progress appears when you have marks in two semesters."
                        columns={[
                            { header: 'Subject', render: (r) => <span className="font-medium text-ink2">{truncateLabel(r.subject.subjectName)}</span> },
                            { header: 'Previous', className: 'hidden text-right sm:table-cell', render: (r) => <span className="text-muted">{r.previous_percentage == null ? '—' : `${Math.round(r.previous_percentage)}%`}</span> },
                            {
                                header: 'Current',
                                className: 'text-right',
                                render: (r) => (
                                    <span className="font-semibold" style={{ color: CHART_COLORS.success }}>
                                        {r.current_percentage == null ? '—' : `${Math.round(r.current_percentage)}%`}
                                    </span>
                                ),
                            },
                            {
                                header: 'Change',
                                className: 'text-right',
                                render: (r) => {
                                    const d = r.delta;
                                    if (d == null) return <span className="text-muted">n/a</span>;
                                    return (
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${d > 0 ? 'bg-success/10 text-success' : d < 0 ? 'bg-danger/10 text-danger' : 'bg-muted/10 text-muted'}`}>
                                            {d > 0 ? '▲' : d < 0 ? '▼' : '◆'} {Math.abs(d)}%
                                        </span>
                                    );
                                },
                            },
                        ]}
                    />
                </div>
            </Card>
        </div>
    );
}