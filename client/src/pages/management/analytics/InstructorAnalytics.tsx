import { useEffect, useMemo, useState } from 'react';
import AnalyticsHeader from '@/pages/analytics/AnalyticsHeader';
import StatCard from '@/pages/analytics/StatCard';
import DataTable from '@/pages/analytics/DataTable';
import { useManagementData } from '@/pages/analytics/useManagementData';
import { classLabel, percentageOf, truncateLabel } from '@/pages/analytics/metrics';
import { getSubjects } from '@/api/subjects';
import Card from '@/components/dashboard/Card';
import Top5Bar from '@/components/dashboard/Top5Bar';
import { CHART_COLORS } from '@/components/charts/palette';
import type { Subject, Teacher } from '@/types';

interface InstructorRow {
    teacher: Teacher;
    count: number;
    pass: number;
    avg: number;
    subjects: string[];
    classes: string[];
}

export default function InstructorAnalytics() {
    const { teachers, allScores, classes, loading, error } = useManagementData();
    const [subjects, setSubjects] = useState<Subject[]>([]);

    useEffect(() => {
        let cancelled = false;
        getSubjects()
            .then((r) => {
                if (!cancelled) setSubjects(r.data.subjects);
            })
            .catch(() => {
                if (!cancelled) setSubjects([]);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const rows = useMemo(() => {
        const map = new Map<number, InstructorRow>();
        teachers.forEach((t) => {
            const listed = subjects
                .filter((s) => s.teacherId === t.id)
                .map((s) => s.subjectName);
            const classNames = subjects
                .filter((s) => s.teacherId === t.id)
                .map((s) => {
                    const c = classes.find((k) => k.id === s.classId);
                    return c ? classLabel(c.class_name, c.section) : `Class #${s.classId}`;
                });
            map.set(t.id, {
                teacher: t,
                count: 0,
                pass: 0,
                avg: 0,
                subjects: Array.from(new Set(listed)),
                classes: Array.from(new Set(classNames)),
            });
        });
        allScores.forEach((sc) => {
            const teacherId = sc.subject?.teacherId;
            if (teacherId === undefined || teacherId === null) return;
            const entry = map.get(teacherId);
            if (!entry) return;
            const pct = percentageOf(sc);
            entry.count += 1;
            entry.avg += pct;
            if (pct >= 50) entry.pass += 1;
        });
        return Array.from(map.values())
            .map((r) => ({ ...r, avg: r.count ? Math.round(r.avg / r.count) : 0 }))
            .sort((a, b) => b.avg - a.avg);
    }, [teachers, subjects, allScores, classes]);

    const ranked = useMemo(() => rows.filter((r) => r.count > 0), [rows]);
    const top5 = useMemo(
        () =>
            ranked.slice(0, 5).map((r) => ({
                label: `${r.teacher.first_name} ${r.teacher.surname}`,
                value: r.avg,
            })),
        [ranked],
    );

    const stats = useMemo(() => {
        const top = ranked[0] ?? null;
        const avgAll = ranked.length
            ? Math.round(ranked.reduce((a, b) => a + b.avg, 0) / ranked.length)
            : 0;
        return {
            ranked: ranked.length,
            assessments: ranked.reduce((a, b) => a + b.count, 0),
            top: top ? `${top.teacher.first_name} ${top.teacher.surname}` : '—',
            topAvg: top ? `${top.avg}%` : '—',
            avgAll,
        };
    }, [ranked]);

    if (loading) return <p className="text-sm text-muted">Loading...</p>;
    if (error) return <p className="text-sm text-danger">{error}</p>;

    return (
        <div className="min-w-0 space-y-6">
            <AnalyticsHeader
                backTo="/management/dashboard"
                title="Instructors in Detail"
                subtitle="Every instructor ranked by the average percentage of the assessments they deliver."
            />

            <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-4">
                <StatCard label="Instructors Ranked" value={stats.ranked} color={CHART_COLORS.blue} />
                <StatCard label="Assessments Delivered" value={stats.assessments} color={CHART_COLORS.gold} />
                <StatCard label="Top Instructor" value={truncateLabel(stats.top)} sub={stats.topAvg} color={CHART_COLORS.success} />
                <StatCard label="Average School Level" value={`${stats.avgAll}%`} color={CHART_COLORS.warning} />
            </div>

            <Card title="Top Instructors" subtitle="Best five by average %" pad={false}>
                <div className="min-w-0 p-4 sm:p-5">
                    {top5.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted">No instructors with scores yet.</p>
                    ) : (
                        <Top5Bar data={top5} height={240} unit="%" width={96} />
                    )}
                </div>
            </Card>

            <Card title="Full Instructor Ranking" subtitle="Subjects taught, classes and assessment performance" pad={false}>
                <div className="p-4 sm:p-5">
                    <DataTable<InstructorRow>
                        data={rows}
                        keyFor={(r) => r.teacher.id}
                        empty="No instructors found."
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
                            {
                                header: 'Instructor',
                                render: (r) => (
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 font-display text-xs font-bold"
                                            style={{ color: CHART_COLORS.goldDark }}
                                        >
                                            {r.teacher.first_name.charAt(0)}
                                            {r.teacher.surname.charAt(0)}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate font-medium text-ink2">
                                                {r.teacher.first_name} {r.teacher.surname}
                                            </p>
                                            <p className="truncate text-xs text-muted">{r.teacher.designation}</p>
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                header: 'Subjects',
                                className: 'hidden md:table-cell',
                                render: (r) => (
                                    <span className="text-muted">
                                        {r.subjects.length ? truncateLabel(r.subjects.join(', ')) : '—'}
                                    </span>
                                ),
                            },
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
                                    <span className="font-semibold" style={{ color: r.count ? CHART_COLORS.blue : CHART_COLORS.muted }}>
                                        {r.count ? `${r.avg}%` : '—'}
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