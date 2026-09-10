import { useMemo } from 'react';
import AnalyticsHeader from '@/pages/analytics/AnalyticsHeader';
import StatCard from '@/pages/analytics/StatCard';
import DataTable from '@/pages/analytics/DataTable';
import { useStudentData } from '@/pages/analytics/useStudentData';
import { percentageOf, truncateLabel } from '@/pages/analytics/metrics';
import type { DatedScore } from '@/pages/analytics/metrics';
import Card from '@/components/dashboard/Card';
import CategoryBars from '@/components/dashboard/CategoryBars';
import { CHART_COLORS } from '@/components/charts/palette';

export default function StudentSubjectsAnalytics() {
    const { student, subjectPercent, scores, loading, error } = useStudentData();

    const subjectBars = useMemo(
        () => subjectPercent.map((v) => ({ label: v.name, value: v.percent })),
        [subjectPercent],
    );

    const stats = useMemo(() => {
        const total = scores.length;
        let obtained = 0;
        let marks = 0;
        scores.forEach((s) => {
            obtained += s.marks_obtained;
            marks += s.total_marks;
        });
        const best = subjectPercent[0];
        const weakest = subjectPercent[subjectPercent.length - 1];
        return {
            total,
            avg: marks ? Math.round((obtained / marks) * 100) : 0,
            best: best ? truncateLabel(best.name) : '—',
            bestAvg: best ? `${best.percent}%` : '—',
            weakest: weakest ? truncateLabel(weakest.name) : '—',
            weakestAvg: weakest ? `${weakest.percent}%` : '—',
        };
    }, [scores, subjectPercent]);

    const assessmentRows = useMemo(
        () =>
            ([...scores].sort(
                (a, b) =>
                    (b.created_at ?? '').localeCompare(a.created_at ?? '') ||
                    percentageOf(b) - percentageOf(a),
            ) as DatedScore[]).slice(0, 30),
        [scores],
    );

    if (loading) return <p className="text-sm text-muted">Loading...</p>;
    if (error) return <p className="text-sm text-danger">{error}</p>;

    return (
        <div className="min-w-0 space-y-6">
            <AnalyticsHeader
                backTo="/student/dashboard"
                title="Subject Performance in Detail"
                subtitle={student ? `Your average percentage for every subject, ${student.firstName} ${student.surname}.` : 'Your average percentage for every subject.'}
            />

            <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-4">
                <StatCard label="Overall Average" value={`${stats.avg}%`} color={CHART_COLORS.blue} />
                <StatCard label="Best Subject" value={stats.best} sub={stats.bestAvg} color={CHART_COLORS.success} />
                <StatCard label="Needs Focus" value={stats.weakest} sub={stats.weakestAvg} color={CHART_COLORS.danger} />
                <StatCard label="Assessments" value={stats.total} color={CHART_COLORS.gold} />
            </div>

            <Card title="Subject Breakdown" subtitle="Average % per subject" pad={false}>
                <div className="min-w-0 p-4 sm:p-5">
                    {subjectBars.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted">No scores recorded yet.</p>
                    ) : (
                        <CategoryBars data={subjectBars} height={260} unit="%" categoryWidth={96} />
                    )}
                </div>
            </Card>

            <Card title="Recent Assessments" subtitle="Your latest 30 marks entries" pad={false}>
                <div className="p-4 sm:p-5">
                    <DataTable<DatedScore>
                        data={assessmentRows}
                        keyFor={(r) => r.id}
                        empty="No scores recorded yet."
                        columns={[
                            { header: 'Subject', render: (r) => <span className="font-medium text-ink2">{truncateLabel(r.subject?.subjectName ?? 'Subject')}</span> },
                            { header: 'Exam', className: 'hidden md:table-cell', render: (r) => <span className="text-muted">{r.exam_type || '—'}</span> },
                            { header: 'Semester', className: 'hidden sm:table-cell', render: (r) => <span className="text-muted">{r.semester}</span> },
                            { header: 'Date', className: 'hidden lg:table-cell', render: (r) => <span className="text-muted">{(r.created_at ?? '').slice(0, 10) || '—'}</span> },
                            { header: 'Marks', className: 'text-right', render: (r) => <span className="text-muted">{r.marks_obtained} / {r.total_marks}</span> },
                            {
                                header: '%',
                                className: 'text-right',
                                render: (r) => {
                                    const pct = percentageOf(r);
                                    return (
                                        <span className={`font-semibold ${pct >= 50 ? 'text-success' : 'text-danger'}`}>
                                            {pct}%
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