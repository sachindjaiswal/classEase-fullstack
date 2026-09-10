import { useEffect, useMemo, useState } from 'react';
import AnalyticsHeader from '@/pages/analytics/AnalyticsHeader';
import StatCard from '@/pages/analytics/StatCard';
import DataTable from '@/pages/analytics/DataTable';
import { useStudentData } from '@/pages/analytics/useStudentData';
import { truncateLabel } from '@/pages/analytics/metrics';
import { getStudentGaps } from '@/api/comparison';
import Card from '@/components/dashboard/Card';
import GroupedBars from '@/components/dashboard/GroupedBars';
import { CHART_COLORS } from '@/components/charts/palette';
import type { StudentGap } from '@/types';

export default function StudentComparisonAnalytics() {
    const { student, loading: studentLoading, error: studentError } = useStudentData();
    const [gaps, setGaps] = useState<StudentGap[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!student) return;
        let cancelled = false;
        setLoading(true);
        getStudentGaps(student.id)
            .then((r) => {
                if (!cancelled) setGaps(r.data.gaps ?? []);
            })
            .catch(() => {
                if (!cancelled) setGaps([]);
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
            gaps.map((g) => ({
                label: g.subject.subjectName,
                Me: Math.round(g.my_percentage),
                'Class avg': Math.round(g.class_average),
                'Top 3': Math.round(g.top3_average),
            })),
        [gaps],
    );

    const stats = useMemo(() => {
        let beatingClass = 0;
        let gapToClass = 0;
        let gapToTop3 = 0;
        gaps.forEach((g) => {
            if (g.my_percentage > g.class_average) beatingClass += 1;
            gapToClass += g.my_percentage - g.class_average;
            gapToTop3 += g.top3_average - g.my_percentage;
        });
        return {
            subjects: gaps.length,
            beating: beatingClass,
            avgGapClass: gaps.length ? Math.round(gapToClass / gaps.length) : 0,
            avgGapTop3: gaps.length ? Math.round(gapToTop3 / gaps.length) : 0,
        };
    }, [gaps]);

    if (studentLoading) return <p className="text-sm text-muted">Loading...</p>;
    if (studentError) return <p className="text-sm text-danger">{studentError}</p>;

    return (
        <div className="min-w-0 space-y-6">
            <AnalyticsHeader
                backTo="/student/dashboard"
                title="You vs Class Average"
                subtitle="Compare yourself against the class average and the top 3 students per subject."
            />

            <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-4">
                <StatCard label="Subjects Compared" value={stats.subjects} color={CHART_COLORS.blue} />
                <StatCard label="Subjects Beating Class" value={`${stats.beating} / ${stats.subjects || '—'}`} color={stats.beating >= stats.subjects / 2 && stats.subjects > 0 ? CHART_COLORS.success : CHART_COLORS.warning} />
                <StatCard label="Avg vs Class" value={`${stats.avgGapClass >= 0 ? '+' : ''}${stats.avgGapClass}%`} color={stats.avgGapClass >= 0 ? CHART_COLORS.success : CHART_COLORS.danger} />
                <StatCard label="Avg Gap to Top 3" value={`${stats.avgGapTop3}%`} color={CHART_COLORS.gold} />
            </div>

            <Card title="Per-Subject Comparison" subtitle="You, the class average and the top 3 average" pad={false}>
                <div className="min-w-0 p-4 sm:p-5">
                    {loading ? (
                        <p className="py-12 text-center text-sm text-muted">Loading comparisons...</p>
                    ) : chartData.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted">Comparisons appear once scores are available.</p>
                    ) : (
                        <GroupedBars
                            data={chartData}
                            height={Math.min(400, Math.max(240, chartData.length * 44))}
                            unit="%"
                            series={[
                                { key: 'Me', color: CHART_COLORS.blue },
                                { key: 'Class avg', color: CHART_COLORS.gold },
                                { key: 'Top 3', color: CHART_COLORS.success },
                            ]}
                        />
                    )}
                </div>
            </Card>

            <Card title="Gap Breakdown" subtitle="Where you lead and where you lag behind" pad={false}>
                <div className="p-4 sm:p-5">
                    <DataTable<StudentGap>
                        data={gaps}
                        keyFor={(r) => r.subject.id}
                        empty="Comparisons appear once scores are available."
                        columns={[
                            { header: 'Subject', render: (r) => <span className="font-medium text-ink2">{truncateLabel(r.subject.subjectName)}</span> },
                            {
                                header: 'You',
                                render: (r) => (
                                    <span className="font-semibold" style={{ color: CHART_COLORS.blue }}>
                                        {Math.round(r.my_percentage)}%
                                    </span>
                                ),
                            },
                            { header: 'Class Avg', className: 'hidden sm:table-cell', render: (r) => <span className="text-muted">{Math.round(r.class_average)}%</span> },
                            { header: 'Top 3 Avg', className: 'hidden md:table-cell', render: (r) => <span className="text-muted">{Math.round(r.top3_average)}%</span> },
                            {
                                header: 'Vs Class',
                                className: 'text-right',
                                render: (r) => {
                                    const d = Math.round(r.my_percentage - r.class_average);
                                    return (
                                        <span className={`font-semibold ${d > 0 ? 'text-success' : d < 0 ? 'text-danger' : 'text-muted'}`}>
                                            {d > 0 ? `+${d}%` : `${d}%`}
                                        </span>
                                    );
                                },
                            },
                            {
                                header: 'Gap to Top 3',
                                className: 'hidden text-right md:table-cell',
                                render: (r) => (
                                    <span className="font-semibold" style={{ color: CHART_COLORS.gold }}>
                                        -{Math.round(r.gap_to_top3)}%
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