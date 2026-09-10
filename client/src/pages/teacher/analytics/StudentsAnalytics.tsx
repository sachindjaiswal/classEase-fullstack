import { useMemo, useState } from 'react';
import AnalyticsHeader from '@/pages/analytics/AnalyticsHeader';
import StatCard from '@/pages/analytics/StatCard';
import DataTable from '@/pages/analytics/DataTable';
import { useTeacherData } from '@/pages/analytics/useTeacherData';
import { percentageOf, truncateLabel } from '@/pages/analytics/metrics';
import Card from '@/components/dashboard/Card';
import CategoryBars from '@/components/dashboard/CategoryBars';
import { CHART_COLORS } from '@/components/charts/palette';

interface StudentRow {
    studentId: number;
    name: string;
    count: number;
    pass: number;
    best: number;
    worst: number;
    avg: number;
}

export default function TeacherStudentsAnalytics() {
    const { teacher, subjects, scores, loading, error } = useTeacherData();
    const [selectedSubject, setSelectedSubject] = useState<number | null>(null);

    const subjectScores = useMemo(() => {
        const effective = selectedSubject ?? subjects[0]?.id ?? null;
        return effective ? scores.filter((s) => s.subject_id === effective) : [];
    }, [selectedSubject, subjects, scores]);

    const students = useMemo(() => {
        const map = new Map<number, StudentRow>();
        subjectScores.forEach((sc) => {
            const sid = sc.student_id;
            const acc = map.get(sid) || {
                studentId: sid,
                name: sc.student
                    ? `${sc.student.firstName} ${sc.student.surname}`
                    : `Student #${sid}`,
                count: 0,
                pass: 0,
                best: 0,
                worst: 100,
                avg: 0,
            };
            const pct = percentageOf(sc);
            acc.count += 1;
            acc.avg += pct;
            acc.best = Math.max(acc.best, pct);
            acc.worst = Math.min(acc.worst, pct);
            if (pct >= 50) acc.pass += 1;
            map.set(sid, acc);
        });
        return Array.from(map.values())
            .map((r) => ({ ...r, avg: r.count ? Math.round(r.avg / r.count) : 0 }))
            .sort((a, b) => b.avg - a.avg);
    }, [subjectScores]);

    const subjectName = useMemo(() => {
        const effective = selectedSubject ?? subjects[0]?.id ?? null;
        return subjects.find((s) => s.id === effective)?.subjectName ?? 'Subject';
    }, [selectedSubject, subjects]);

    const stats = useMemo(() => {
        const total = subjectScores.length;
        const pass = subjectScores.filter((s) => percentageOf(s) >= 50).length;
        const sum = subjectScores.reduce((a, s) => a + percentageOf(s), 0);
        return {
            total,
            avg: total ? Math.round(sum / total) : 0,
            passRate: total ? Math.round((pass / total) * 100) : 0,
            students: students.length,
        };
    }, [subjectScores, students]);

    const subjectSelect = (
        <select
            value={selectedSubject ?? subjects[0]?.id ?? ''}
            onChange={(e) => setSelectedSubject(Number(e.target.value))}
            className="max-w-[180px] rounded-lg border border-border bg-surface px-2 py-1 text-xs text-ink2 outline-none"
        >
            {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                    {s.subjectName}
                </option>
            ))}
        </select>
    );

    if (loading) return <p className="text-sm text-muted">Loading...</p>;
    if (error) return <p className="text-sm text-danger">{error}</p>;

    return (
        <div className="min-w-0 space-y-6">
            <AnalyticsHeader
                backTo="/teacher/dashboard"
                title="Student Performance in Detail"
                subtitle={`Your results for ${subjectName} across all of its classes.`}
                children={subjects.length > 1 ? subjectSelect : undefined}
            />

            {teacher && (
                <p className="text-xs text-muted">
                    Showing results for <span className="font-medium text-ink2">{subjectName}</span> taught by{' '}
                    <span className="font-medium text-ink2">{teacher.first_name} {teacher.surname}</span>.
                </p>
            )}

            <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-4">
                <StatCard label="Students Ranked" value={stats.students} color={CHART_COLORS.blue} />
                <StatCard label="Subject Average" value={`${stats.avg}%`} color={CHART_COLORS.gold} />
                <StatCard label="Pass Rate" value={`${stats.passRate}%`} color={stats.passRate >= 50 ? CHART_COLORS.success : CHART_COLORS.danger} />
                <StatCard label="Assessments" value={stats.total} color={CHART_COLORS.warning} />
            </div>

            <Card title="Full Student Ranking" subtitle="Average percentage per student" pad={false}>
                <div className="min-w-0 p-4 sm:p-5">
                    {students.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted">No scores recorded for this subject yet.</p>
                    ) : (
                        <>
                            <CategoryBars
                                data={students.map((r) => ({ label: r.name, value: r.avg }))}
                                height={Math.min(360, Math.max(180, students.length * 34))}
                                unit="%"
                                categoryWidth={110}
                            />
                            <div className="mt-4">
                                <DataTable<StudentRow>
                                    data={students}
                                    keyFor={(r) => r.studentId}
                                    empty="No scores recorded for this subject yet."
                                    columns={[
                                        {
                                            header: '#',
                                            className: 'w-10',
                                            render: (_, i) => {
                                                const color =
                                                    i === 0 ? CHART_COLORS.gold : i === 1 ? CHART_COLORS.ink2 : i === 2 ? CHART_COLORS.goldDark : 'inherit';
                                                return <span className="font-semibold" style={{ color }}>{i + 1}</span>;
                                            },
                                        },
                                        { header: 'Student', render: (r) => <span className="font-medium text-ink2">{truncateLabel(r.name)}</span> },
                                        { header: 'Assessments', className: 'hidden text-right sm:table-cell', render: (r) => <span className="text-muted">{r.count}</span> },
                                        { header: 'Best / Worst', className: 'hidden text-right md:table-cell', render: (r) => <span className="text-muted">{r.best}% / {r.worst}%</span> },
                                        {
                                            header: 'Status',
                                            render: (r) => (
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${r.avg >= 50 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                                    {r.avg >= 50 ? 'Passing' : 'Needs work'}
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
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
}