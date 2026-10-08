import { useEffect, useMemo, useState } from 'react';
import AnalyticsHeader from '@/pages/analytics/AnalyticsHeader';
import StatCard from '@/pages/analytics/StatCard';
import DataTable from '@/pages/analytics/DataTable';
import { useStudentData } from '@/pages/analytics/useStudentData';
import { classLabel } from '@/pages/analytics/metrics';
import { getLeaderboardByClass } from '@/api/leaderboard';
import Card from '@/components/dashboard/Card';
import { CHART_COLORS } from '@/components/charts/palette';
import type { LeaderboardEntry } from '@/types';

export default function StudentRankAnalytics() {
    const { student, loading, error } = useStudentData();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [rankLoading, setRankLoading] = useState(false);

    useEffect(() => {
        const cid = student?.class?.id;
        if (!cid) return;
        let cancelled = false;
        setRankLoading(true);
        getLeaderboardByClass(cid)
            .then((r) => {
                if (!cancelled) setLeaderboard(r.data.leaderboard ?? []);
            })
            .catch(() => {
                if (!cancelled) setLeaderboard([]);
            })
            .finally(() => {
                if (!cancelled) setRankLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [student]);

    const myRank = useMemo(() => {
        if (!student) return null;
        const i = leaderboard.findIndex((e) => e.student?.id === student.id);
        if (i === -1) return null;
        const entry = leaderboard[i];
        return {
            rank: i + 1,
            total: leaderboard.length,
            avg: entry.average_percentage,
            exams: entry.exams_count,
        };
    }, [leaderboard, student]);

    const classAvg = useMemo(() => {
        if (!leaderboard.length) return 0;
        const totalMarks = leaderboard.reduce((a, r) => a + r.total_marks, 0);
        const obtained = leaderboard.reduce((a, r) => a + r.marks_obtained, 0);
        return totalMarks ? Math.round((obtained / totalMarks) * 100) : 0;
    }, [leaderboard]);

    const topThree = useMemo(
        () =>
            leaderboard.slice(0, 3).map((e) =>
                e.student ? `${e.student.firstName} ${e.student.surname}` : 'Unknown',
            ),
        [leaderboard],
    );

    if (loading) return <p className="text-sm text-muted">Loading...</p>;
    if (error) return <p className="text-sm text-danger">{error}</p>;

    return (
        <div className="min-w-0 space-y-6">
            <AnalyticsHeader
                backTo="/student/dashboard"
                title="Class Rank in Detail"
                subtitle={
                    student?.class
                        ? `Full leaderboard for ${classLabel(student.class.class_name, student.class.section)}.`
                        : 'Full class leaderboard.'
                }
            />

            <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-4">
                <StatCard label="Your Rank" value={myRank ? `#${myRank.rank}` : '—'} sub={myRank ? `of ${myRank.total}` : undefined} color={CHART_COLORS.gold} />
                <StatCard label="Your Average" value={myRank ? `${Math.round(myRank.avg)}%` : '—'} color={CHART_COLORS.blue} />
                <StatCard label="Class Average" value={`${classAvg}%`} color={myRank && myRank.avg >= classAvg ? CHART_COLORS.success : CHART_COLORS.warning} />
                <StatCard label="Top Three" value={topThree.length ? 'Ranked' : '—'} sub={topThree[0] ?? undefined} color={CHART_COLORS.success} />
            </div>

            <Card
                title="Full Class Leaderboard"
                subtitle="Every student ranked by average percentage"
                action={
                    myRank ? (
                        <span className="rounded-full bg-gold/10 px-2.5 py-1 text-xs font-semibold" style={{ color: CHART_COLORS.goldDark }}>
                            You: #{myRank.rank} of {myRank.total}
                        </span>
                    ) : undefined
                }
                pad={false}
            >
                <div className="p-4 sm:p-5">
                    {rankLoading ? (
                        <p className="py-10 text-center text-sm text-muted">Loading leaderboard...</p>
                    ) : (
                        <DataTable<LeaderboardEntry>
                            data={leaderboard}
                            keyFor={(r) => r.rank}
                            empty="Leaderboard appears once scores are recorded."
                            columns={[
                                {
                                    header: '#',
                                    className: 'w-10',
                                    render: (_, i) => {
                                        const color =
                                            i === 0
                                                ? CHART_COLORS.gold
                                                : i === 1
                                                  ? CHART_COLORS.ink2
                                                  : i === 2
                                                    ? CHART_COLORS.goldDark
                                                    : 'inherit';
                                        return <span className="font-semibold" style={{ color }}>{i + 1}</span>;
                                    },
                                },
                                {
                                    header: 'Student',
                                    render: (r) => {
                                        const isYou = r.student?.id === student?.id;
                                        return (
                                            <span className={`font-medium ${isYou ? 'text-gold-dark' : 'text-ink2'}`}>
                                                {r.student ? `${r.student.firstName} ${r.student.surname}` : 'Student'}
                                                {isYou && <span className="ml-1.5 text-xs font-semibold text-gold">(you)</span>}
                                            </span>
                                        );
                                    },
                                },
                                { header: 'Exams', className: 'hidden text-right sm:table-cell', render: (r) => <span className="text-muted">{r.exams_count}</span> },
                                { header: 'Marks', className: 'hidden text-right md:table-cell', render: (r) => <span className="text-muted">{r.marks_obtained} / {r.total_marks}</span> },
                                {
                                    header: 'Average',
                                    className: 'text-right',
                                    render: (r) => {
                                        const isYou = r.student?.id === student?.id;
                                        return (
                                            <span className="font-semibold" style={{ color: isYou ? CHART_COLORS.gold : CHART_COLORS.blue }}>
                                                {Math.round(r.average_percentage)}%
                                            </span>
                                        );
                                    },
                                },
                            ]}
                        />
                    )}
                </div>
            </Card>
        </div>
    );
}