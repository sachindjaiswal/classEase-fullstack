import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AnalyticsHeader from '@/pages/analytics/AnalyticsHeader';
import StatCard from '@/pages/analytics/StatCard';
import DataTable from '@/pages/analytics/DataTable';
import { useManagementData } from '@/pages/analytics/useManagementData';
import { classLabel, percentageOf, truncateLabel } from '@/pages/analytics/metrics';
import { getLeaderboardByClass } from '@/api/leaderboard';
import Card from '@/components/dashboard/Card';
import CategoryBars from '@/components/dashboard/CategoryBars';
import PassDonut from '@/components/dashboard/PassDonut';
import { CHART_COLORS } from '@/components/charts/palette';
import type { LeaderboardEntry } from '@/types';

export default function ClassPerformanceAnalytics() {
    const { classes, studentsByClass, scoresByClass, loading, error } = useManagementData();
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        if (classes.length > 0 && selectedClassId === null) {
            setSelectedClassId(classes[0].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classes]);

    useEffect(() => {
        if (selectedClassId === null) return;
        let cancelled = false;
        getLeaderboardByClass(selectedClassId)
            .then((r) => {
                if (!cancelled) setLeaderboard(r.data.leaderboard ?? []);
            })
            .catch(() => {
                if (!cancelled) setLeaderboard([]);
            });
        return () => {
            cancelled = true;
        };
    }, [selectedClassId]);

    const selectedClass = useMemo(
        () => classes.find((c) => c.id === selectedClassId) ?? null,
        [classes, selectedClassId],
    );

    const classScores = useMemo(
        () => scoresByClass[selectedClassId ?? -1] ?? [],
        [scoresByClass, selectedClassId],
    );

    const classStats = useMemo(() => {
        const total = classScores.length;
        let obtained = 0;
        let marks = 0;
        let pass = 0;
        classScores.forEach((s) => {
            obtained += s.marks_obtained;
            marks += s.total_marks;
            if (percentageOf(s) >= 50) pass += 1;
        });
        return {
            total,
            avg: marks ? Math.round((obtained / marks) * 100) : 0,
            passRate: total ? Math.round((pass / total) * 100) : 0,
            students: studentsByClass[selectedClassId ?? -1] ?? 0,
        };
    }, [classScores, studentsByClass, selectedClassId]);

    const subjectRows = useMemo(() => {
        const map = new Map<number, { subjectId: number; name: string; count: number; pass: number; sum: number }>();
        classScores.forEach((sc) => {
            const acc = map.get(sc.subject_id) || {
                subjectId: sc.subject_id,
                name: sc.subject?.subjectName ?? `Subject #${sc.subject_id}`,
                count: 0,
                pass: 0,
                sum: 0,
            };
            acc.count += 1;
            acc.sum += percentageOf(sc);
            if (percentageOf(sc) >= 50) acc.pass += 1;
            map.set(sc.subject_id, acc);
        });
        return Array.from(map.values())
            .map((r) => ({ ...r, avg: r.count ? Math.round(r.sum / r.count) : 0 }))
            .map(({ sum, ...rest }: { subjectId: number; name: string; count: number; pass: number; avg: number; sum: number }) => rest)
            .sort((a, b) => b.avg - a.avg);
    }, [classScores]);

    const subjectBars = useMemo(
        () => subjectRows.map((r) => ({ label: r.name, value: r.avg })),
        [subjectRows],
    );

    const classComparison = useMemo(
        () =>
            classes.map((c) => {
                const scores = scoresByClass[c.id] ?? [];
                let obtained = 0;
                let marks = 0;
                scores.forEach((s) => {
                    obtained += s.marks_obtained;
                    marks += s.total_marks;
                });
                return {
                    label: `${c.class_name}${c.section ? ` ${c.section}` : ''}`,
                    value: marks ? Math.round((obtained / marks) * 100) : 0,
                };
            }),
        [classes, scoresByClass],
    );

    const classSelect = (
        <select
            value={selectedClassId ?? ''}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
            className="max-w-[200px] rounded-lg border border-border bg-surface px-2 py-1 text-xs text-ink2 outline-none"
        >
            {classes.map((c) => (
                <option key={c.id} value={c.id}>
                    {classLabel(c.class_name, c.section)}
                </option>
            ))}
        </select>
    );

    if (loading) return <p className="text-sm text-muted">Loading...</p>;
    if (error) return <p className="text-sm text-danger">{error}</p>;

    return (
        <div className="min-w-0 space-y-6">
            <AnalyticsHeader
                backTo="/management/dashboard"
                title="Class Performance in Detail"
                subtitle="Compare every class, then drill into subjects and top students for one class."
                children={classSelect}
            />

            <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-4">
                <StatCard label="Class Average" value={`${classStats.avg}%`} color={CHART_COLORS.blue} />
                <StatCard label="Assessments" value={classStats.total} color={CHART_COLORS.gold} />
                <StatCard label="Students" value={classStats.students} color={CHART_COLORS.warning} />
                <StatCard label="Pass Rate" value={`${classStats.passRate}%`} color={classStats.passRate >= 50 ? CHART_COLORS.success : CHART_COLORS.danger} />
            </div>

            <Card title="Class Comparison" subtitle="Average percentage across every class" pad={false}>
                <div className="min-w-0 p-4 sm:p-5">
                    {classComparison.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted">No classes yet.</p>
                    ) : (
                        <CategoryBars data={classComparison} height={260} unit="%" categoryWidth={80} />
                    )}
                </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
                <Card title="Subject Breakdown" subtitle={`Average % per subject in ${classLabel(selectedClass?.class_name ?? '', selectedClass?.section)}`} pad={false}>
                    <div className="min-w-0 p-4 sm:p-5">
                        {subjectBars.length === 0 ? (
                            <p className="py-12 text-center text-sm text-muted">No scores yet for this class.</p>
                        ) : (
                            <CategoryBars data={subjectBars} height={260} unit="%" categoryWidth={96} />
                        )}
                    </div>
                </Card>

                <Card title="Pass Split" subtitle={`Pass/fail across all ${selectedClass ? classLabel(selectedClass.class_name, selectedClass.section) : 'class'} assessments`} pad={false}>
                    <div className="p-5 sm:p-6">
                        <PassDonut
                            data={[
                                { name: 'Pass', value: classScores.filter((s) => percentageOf(s) >= 50).length },
                                { name: 'Needs work', value: classScores.filter((s) => percentageOf(s) < 50).length },
                            ]}
                            centerLabel={classStats.total ? `${classStats.passRate}%` : '—'}
                            centerSub="Pass"
                            height={220}
                            colors={[CHART_COLORS.success, CHART_COLORS.danger]}
                        />
                        <div className="mt-2 flex items-center justify-center gap-4 text-xs">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS.success }} />
                                Pass · {classScores.filter((s) => percentageOf(s) >= 50).length}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS.danger }} />
                                Needs work · {classScores.filter((s) => percentageOf(s) < 50).length}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            <Card
                title="Top Students"
                subtitle={`Class leaderboard for ${selectedClass ? classLabel(selectedClass.class_name, selectedClass.section) : 'the class'}`}
                action={
                    selectedClass ? (
                        <Link
                            to="/management/leaderboard"
                            className="text-xs font-medium text-ink hover:text-gold"
                        >
                            Open leaderboard
                        </Link>
                    ) : undefined
                }
                pad={false}
            >
                <div className="p-4 sm:p-5">
                    <DataTable<LeaderboardEntry>
                        data={leaderboard.slice(0, 10)}
                        keyFor={(r) => r.rank}
                        empty="Leaderboard appears once scores are recorded."
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
                                header: 'Student',
                                render: (r) => (
                                    <span className="font-medium text-ink2">
                                        {r.student ? `${r.student.firstName} ${r.student.surname}` : 'Student'}
                                    </span>
                                ),
                            },
                            {
                                header: 'Exams',
                                className: 'text-right',
                                render: (r) => <span className="text-muted">{r.exams_count}</span>,
                            },
                            {
                                header: 'Marks',
                                className: 'text-right',
                                render: (r) => (
                                    <span className="text-muted">
                                        {r.marks_obtained} / {r.total_marks}
                                    </span>
                                ),
                            },
                            {
                                header: 'Average',
                                className: 'text-right',
                                render: (r) => (
                                    <span className="font-semibold" style={{ color: CHART_COLORS.blue }}>
                                        {Math.round(r.average_percentage)}%
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