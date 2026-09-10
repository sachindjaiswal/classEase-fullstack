import { useMemo } from 'react';
import AnalyticsHeader from '@/pages/analytics/AnalyticsHeader';
import StatCard from '@/pages/analytics/StatCard';
import DataTable from '@/pages/analytics/DataTable';
import { useTeacherData } from '@/pages/analytics/useTeacherData';
import { classLabel, monthKey, monthLabel, percentageOf, truncateLabel } from '@/pages/analytics/metrics';
import Card from '@/components/dashboard/Card';
import CategoryBars from '@/components/dashboard/CategoryBars';
import TrendChart from '@/components/dashboard/TrendChart';
import { CHART_COLORS } from '@/components/charts/palette';

interface SubjectRow {
    subjectId: number;
    name: string;
    className: string;
    count: number;
    pass: number;
    avg: number;
}

export default function TeacherClassPerformanceAnalytics() {
    const { teacher, subjects, classes, scores, loading, error } = useTeacherData();

    const subjectRows = useMemo(() => {
        const map = new Map<number, SubjectRow>();
        scores.forEach((sc) => {
            const acc = map.get(sc.subject_id) || {
                subjectId: sc.subject_id,
                name: sc.subject?.subjectName ?? `Subject #${sc.subject_id}`,
                className: '',
                count: 0,
                pass: 0,
                avg: 0,
            };
            acc.count += 1;
            acc.avg += percentageOf(sc);
            if (percentageOf(sc) >= 50) acc.pass += 1;
            map.set(sc.subject_id, acc);
        });
        const classOf = (subjectId: number) => {
            const s = subjects.find((x) => x.id === subjectId);
            if (!s) return '—';
            const c = classes.find((k) => k.id === s.classId);
            return c ? classLabel(c.class_name, c.section) : `Class #${s.classId}`;
        };
        return Array.from(map.values())
            .map((r) => ({
                ...r,
                avg: r.count ? Math.round(r.avg / r.count) : 0,
                className: classOf(r.subjectId),
            }))
            .sort((a, b) => b.avg - a.avg);
    }, [scores, subjects, classes]);

    const subjectBars = useMemo(
        () => subjectRows.map((r) => ({ label: r.name, value: r.avg })),
        [subjectRows],
    );

    const monthlyTrend = useMemo(() => {
        const buckets = new Map<string, { label: string; sum: number; count: number }>();
        scores.forEach((sc) => {
            if (!sc.created_at) return;
            const key = monthKey(sc.created_at);
            if (!key) return;
            const bucket = buckets.get(key) || { label: monthLabel(sc.created_at), sum: 0, count: 0 };
            bucket.sum += percentageOf(sc);
            bucket.count += 1;
            buckets.set(key, bucket);
        });
        return Array.from(buckets.values())
            .map((b) => ({ label: b.label, value: b.count ? Math.round(b.sum / b.count) : 0 }))
            .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
    }, [scores]);

    const stats = useMemo(() => {
        const total = scores.length;
        const pass = scores.filter((s) => percentageOf(s) >= 50).length;
        const sum = scores.reduce((a, s) => a + percentageOf(s), 0);
        return {
            subjects: subjectRows.length,
            classes: new Set(subjectRows.map((r) => r.className)).size,
            assessments: total,
            avg: total ? Math.round(sum / total) : 0,
            passRate: total ? Math.round((pass / total) * 100) : 0,
        };
    }, [scores, subjectRows]);

    if (loading) return <p className="text-sm text-muted">Loading...</p>;
    if (error) return <p className="text-sm text-danger">{error}</p>;

    return (
        <div className="min-w-0 space-y-6">
            <AnalyticsHeader
                backTo="/teacher/dashboard"
                title="Class Performance by Subject"
                subtitle={
                    teacher
                        ? `All subjects taught by ${teacher.first_name} ${teacher.surname}.`
                        : 'All subjects you teach.'
                }
            />

            <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-4">
                <StatCard label="Subjects" value={stats.subjects} color={CHART_COLORS.blue} />
                <StatCard label="Classes" value={stats.classes} color={CHART_COLORS.gold} />
                <StatCard label="Overall Average" value={`${stats.avg}%`} color={CHART_COLORS.success} />
                <StatCard label="Pass Rate" value={`${stats.passRate}%`} color={stats.passRate >= 50 ? CHART_COLORS.success : CHART_COLORS.danger} />
            </div>

            <Card title="Subject Averages" subtitle="How well each subject is performing" pad={false}>
                <div className="min-w-0 p-4 sm:p-5">
                    {subjectBars.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted">No scores recorded for your subjects yet.</p>
                    ) : (
                        <CategoryBars data={subjectBars} height={240} unit="%" categoryWidth={96} />
                    )}
                </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
                <Card title="Performance Over Time" subtitle="Your average score % per month" pad={false}>
                    <div className="min-w-0 p-4 sm:p-5">
                        {monthlyTrend.length === 0 ? (
                            <p className="py-12 text-center text-sm text-muted">No scores recorded yet.</p>
                        ) : (
                            <TrendChart data={monthlyTrend} height={240} maxLabel={0} />
                        )}
                    </div>
                </Card>

                <Card title="Subject Breakdown" subtitle="Assessments, pass rates and averages per subject" pad={false}>
                    <div className="p-4 sm:p-5">
                        <DataTable<SubjectRow>
                            data={subjectRows}
                            keyFor={(r) => r.subjectId}
                            empty="No scores recorded for your subjects yet."
                            columns={[
                                { header: 'Subject', render: (r) => <span className="font-medium text-ink2">{truncateLabel(r.name)}</span> },
                                { header: 'Class', className: 'hidden md:table-cell', render: (r) => <span className="text-muted">{truncateLabel(r.className)}</span> },
                                { header: 'Assessments', className: 'hidden text-right sm:table-cell', render: (r) => <span className="text-muted">{r.count}</span> },
                                {
                                    header: 'Pass Rate',
                                    className: 'hidden text-right md:table-cell',
                                    render: (r) => (
                                        <span className={`font-semibold ${r.count ? (r.pass / r.count >= 0.5 ? 'text-success' : 'text-danger') : 'text-muted'}`}>
                                            {r.count ? `${Math.round((r.pass / r.count) * 100)}%` : '—'}
                                        </span>
                                    ),
                                },
                                {
                                    header: 'Average',
                                    className: 'text-right',
                                    render: (r) => (
                                        <span className="font-semibold" style={{ color: CHART_COLORS.blue }}>
                                            {r.avg}%
                                        </span>
                                    ),
                                },
                            ]}
                        />
                    </div>
                </Card>
            </div>
        </div>
    );
}