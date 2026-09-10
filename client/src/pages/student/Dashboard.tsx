import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getMyStudent, getStudentSubjects } from '@/api/students';
import { getStudentScores } from '@/api/scores';
import { getDashboardFeed } from '@/api/dashboard';
import { getLeaderboardByClass } from '@/api/leaderboard';
import { getStudentAttendance } from '@/api/attendance';
import { getStudentGaps, getStudentProgress } from '@/api/comparison';
import NoticesTasks from '@/components/NoticesTasks';
import HeroBanner, { KpiBadge } from '@/components/dashboard/HeroBanner';
import Card from '@/components/dashboard/Card';
import ListRow from '@/components/dashboard/ListRow';
import TrendChart from '@/components/dashboard/TrendChart';
import Top5Bar from '@/components/dashboard/Top5Bar';
import CategoryBars from '@/components/dashboard/CategoryBars';
import GroupedBars from '@/components/dashboard/GroupedBars';
import PassDonut from '@/components/dashboard/PassDonut';
import Sparkline from '@/components/dashboard/Sparkline';
import { ICONS } from '@/components/dashboard/icons';
import { CHART_COLORS } from '@/components/charts/palette';
import type {
    Announcement,
    AttendanceSummary,
    Homework,
    LeaderboardEntry,
    ProgressEntry,
    ScoreFull,
    Student,
    StudentGap,
    SubjectFull,
} from '@/types';

type DatedScore = ScoreFull & { created_at?: string };

function monthKey(dateStr: string): string {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function monthLabel(dateStr: string): string {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

function percentageOf(s: ScoreFull): number {
    return s.total_marks ? Math.round((s.marks_obtained / s.total_marks) * 100) : 0;
}

export default function StudentDashboard() {
    const { user } = useAuth();
    const [student, setStudent] = useState<Student | null>(null);
    const [subjects, setSubjects] = useState<SubjectFull[]>([]);
    const [scores, setScores] = useState<DatedScore[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [homeworks, setHomeworks] = useState<Homework[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
    const [gaps, setGaps] = useState<StudentGap[]>([]);
    const [progress, setProgress] = useState<ProgressEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;

        (async () => {
            try {
                const res = await getMyStudent();
                const s = res.data.student;
                const classId = s.class?.id;
                const calls: Promise<{ label: string; data: unknown }>[] = [
                    getStudentSubjects(s.id).then((r) => ({ label: 'subjects', data: r.data.subjects })),
                    getStudentScores(s.id).then((r) => ({ label: 'scores', data: r.data.scores })),
                    getDashboardFeed().then((r) => ({
                        label: 'feed',
                        data: { announcements: r.data.announcements, homeworks: r.data.homeworks },
                    })),
                    getStudentAttendance(s.id).then((r) => ({
                        label: 'attendance',
                        data: { summary: r.data.summary },
                    })),
                ];

                if (classId) {
                    calls.push(
                        getLeaderboardByClass(classId).then((r) => ({
                            label: 'leaderboard',
                            data: r.data.leaderboard ?? [],
                        })),
                    );
                }

                calls.push(
                    getStudentGaps(s.id).then((r) => ({ label: 'gaps', data: r.data.gaps ?? [] })),
                    getStudentProgress(s.id).then((r) => ({ label: 'progress', data: r.data.progress ?? [] })),
                );

                const results = await Promise.all(calls);
                if (cancelled) return;

                const byLabel = Object.fromEntries(results.map((r) => [r.label, r.data])) as Record<string, unknown>;
                setStudent(s);
                setSubjects((byLabel.subjects as SubjectFull[]) ?? []);
                setScores((byLabel.scores as unknown as DatedScore[]) ?? []);
                const feed = byLabel.feed as { announcements: Announcement[]; homeworks: Homework[] };
                setAnnouncements(feed?.announcements ?? []);
                setHomeworks(feed?.homeworks ?? []);
                const att = byLabel.attendance as { summary: AttendanceSummary | null };
                setAttendance(att?.summary ?? null);
                setLeaderboard((byLabel.leaderboard as LeaderboardEntry[]) ?? []);
                setGaps((byLabel.gaps as StudentGap[]) ?? []);
                setProgress((byLabel.progress as ProgressEntry[]) ?? []);
            } catch {
                if (!cancelled) setError("Couldn't load dashboard data.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [user]);

    const myRank = useMemo(() => {
        if (!student) return null;
        const i = leaderboard.findIndex((e) => e.student?.id === student.id);
        if (i === -1) return null;
        return { rank: leaderboard[i].rank ?? i + 1, total: leaderboard.length, avg: leaderboard[i].average_percentage };
    }, [leaderboard, student]);

    const subjectPercent = useMemo(() => {
        const map: Record<string, { subject: string; percent: number; obtained: number; total: number }> = {};
        scores.forEach((sc) => {
            const key = sc.subject_id;
            const name = sc.subject?.subjectName ?? `Subject ${sc.subject_id}`;
            if (!map[key]) map[key] = { subject: name, percent: 0, obtained: 0, total: 0 };
            map[key].obtained += sc.marks_obtained;
            map[key].total += sc.total_marks;
        });
        Object.values(map).forEach((v) => {
            v.percent = v.total ? Math.round((v.obtained / v.total) * 100) : 0;
        });
        return Object.values(map).sort((a, b) => b.percent - a.percent);
    }, [scores]);

    const subjectPerformanceData = useMemo(
        () => subjectPercent.map((v) => ({ label: v.subject, value: v.percent })),
        [subjectPercent],
    );

    const top5Subjects = useMemo(() => subjectPerformanceData.slice(0, 5), [subjectPerformanceData]);

    const vsClass = useMemo(
        () =>
            gaps.map((gap) => ({
                label: gap.subject.subjectName,
                Me: Math.round(gap.my_percentage),
                'Class avg': Math.round(gap.class_average),
                'Top 3': Math.round(gap.top3_average),
            })),
        [gaps],
    );

    const progressData = useMemo(
        () =>
            progress.map((p) => ({
                label: p.subject.subjectName,
                Previous: p.previous_percentage == null ? null : Math.round(p.previous_percentage),
                Current: p.current_percentage == null ? null : Math.round(p.current_percentage),
            })),
        [progress],
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
            .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }))
            .slice(-6);
    }, [scores]);

    const contentUsage = useMemo(() => {
        const buckets = new Map<string, { label: string; count: number }>();
        scores.forEach((sc) => {
            if (!sc.created_at) return;
            const key = monthKey(sc.created_at);
            if (!key) return;
            const bucket = buckets.get(key) || { label: monthLabel(sc.created_at), count: 0 };
            bucket.count += 1;
            buckets.set(key, bucket);
        });
        return Array.from(buckets.values())
            .map((b) => ({ label: b.label, value: b.count }))
            .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
    }, [scores]);

    const attendancePie = useMemo(() => {
        if (!attendance) return [];
        return [
            { name: 'Present', value: attendance.present },
            { name: 'Absent', value: attendance.absent },
            { name: 'Late', value: attendance.late },
        ].filter((d) => d.value > 0);
    }, [attendance]);

    const attendanceRate = useMemo(() => {
        if (!attendance || attendance.total === 0) return 0;
        return Math.round((attendance.present / attendance.total) * 100);
    }, [attendance]);

    const avgPercent = useMemo(() => {
        if (scores.length === 0) return 0;
        const tot = scores.reduce((a, s) => a + s.total_marks, 0);
        const obt = scores.reduce((a, s) => a + s.marks_obtained, 0);
        return tot ? Math.round((obt / tot) * 100) : 0;
    }, [scores]);

    const today = new Date().toISOString().slice(0, 10);
    const homeworkStats = useMemo(() => {
        let overdue = 0;
        let dueToday = 0;
        let upcoming = 0;
        homeworks.forEach((hw) => {
            const due = (hw.due_date ?? '').slice(0, 10);
            if (due && due < today) overdue += 1;
            else if (due === today) dueToday += 1;
            else upcoming += 1;
        });
        return { overdue, dueToday, upcoming };
    }, [homeworks, today]);

    const overallDelta = useMemo(() => {
        let cur = 0;
        let prev = 0;
        let curSeen = false;
        let prevSeen = false;
        progress.forEach((p) => {
            if (p.current_percentage != null) {
                cur += p.current_percentage;
                curSeen = true;
            }
            if (p.previous_percentage != null) {
                prev += p.previous_percentage;
                prevSeen = true;
            }
        });
        if (!curSeen || !prevSeen) return null;
        return Math.round(cur - prev);
    }, [progress]);

    return (
        <div className="min-w-0 space-y-6">
            {loading && <p className="text-sm text-muted">Loading...</p>}
            {error && <p className="text-sm text-danger">{error}</p>}

            {!loading && !error && student && (
                <>
                    <HeroBanner
                        title={`Welcome back, ${user?.name}`}
                        subtitle={`${student.class?.class_name ?? 'Class'}${student.class?.section ? ` — ${student.class.section}` : ''} • ${today}`}
                    >
                        <KpiBadge
                            icon={ICONS.award}
                            label="Class Rank"
                            value={myRank ? `#${myRank.rank} / ${myRank.total}` : '—'}
                            accent={CHART_COLORS.gold}
                        />
                        <KpiBadge
                            icon={ICONS.chart}
                            label="Overall Average"
                            value={`${avgPercent}%`}
                            accent={CHART_COLORS.success}
                        />
                        <KpiBadge
                            icon={ICONS.students}
                            label="Attendance Rate"
                            value={`${attendanceRate}%`}
                            accent={CHART_COLORS.warning}
                        />
                        <KpiBadge
                            icon={ICONS.book}
                            label="Pending Tasks"
                            value={homeworkStats.overdue + homeworkStats.upcoming}
                            accent={CHART_COLORS.ink}
                        />
                    </HeroBanner>

                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-6 xl:grid-cols-12">
                        <Card
                            title="Popular Courses"
                            subtitle="Your subjects by average %"
                            className="md:col-span-3 xl:col-span-3"
                            pad={false}
                        >
                            <div className="flex min-w-0 flex-col gap-2 p-4 sm:p-5">
                                {subjects.length === 0 && (
                                    <p className="py-8 text-center text-sm text-muted">No subjects assigned.</p>
                                )}
                                {subjects.map((s) => {
                                    const avg = subjectPercent.find((x) => x.subject === s.subjectName);
                                    return (
                                        <ListRow
                                            key={s.id}
                                            icon={ICONS.book}
                                            iconBg="bg-teal/10"
                                            iconColor="text-teal"
                                            title={s.subjectName}
                                            subtitle={s.class?.class_name ?? `Class #${s.classId}`}
                                            trailing={avg ? `${avg.percent}%` : '—'}
                                        />
                                    );
                                })}
                            </div>
                        </Card>

                        <Card
                            title="Current Activity"
                            subtitle="Your average score % per month"
                            className="md:col-span-6 xl:col-span-6"
                            pad={false}
                            action={
                                <Link to="/student/analytics/subjects" className="text-xs font-medium text-ink hover:text-gold">
                                    View details
                                </Link>
                            }
                        >
                            <div className="min-w-0 p-4 sm:p-5">
                                <TrendChart data={monthlyTrend} height={230} maxLabel={0} />
                            </div>
                        </Card>

                        <Card
                            title="Overall Pass Percentage"
                            subtitle="Across all your assessments"
                            className="md:col-span-3 xl:col-span-3"
                            pad={false}
                            action={
                                <Link to="/student/analytics/subjects" className="text-xs font-medium text-ink hover:text-gold">
                                    View details
                                </Link>
                            }
                        >
                            <div className="p-5 sm:p-6">
                                <PassDonut
                                    data={[
                                        {
                                            name: 'Pass',
                                            value: scores.filter((s) => percentageOf(s) >= 50).length,
                                        },
                                        {
                                            name: 'Needs work',
                                            value: scores.filter((s) => percentageOf(s) < 50).length,
                                        },
                                    ]}
                                    centerLabel={avgPercent ? `${avgPercent}%` : '—'}
                                    centerSub="Avg"
                                    height={190}
                                    colors={[CHART_COLORS.success, CHART_COLORS.danger]}
                                />
                                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS.success }} />
                                        Pass
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS.danger }} />
                                        Needs work
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
                        <Card
                            title="Top 5 Subjects"
                            subtitle="Ranked by your performance"
                            pad={false}
                            action={
                                <Link to="/student/analytics/subjects" className="text-xs font-medium text-ink hover:text-gold">
                                    View details
                                </Link>
                            }
                        >
                            <div className="min-w-0 p-4 sm:p-5">
                                {top5Subjects.length === 0 ? (
                                    <p className="py-12 text-center text-sm text-muted">No scores yet.</p>
                                ) : (
                                    <Top5Bar data={top5Subjects} height={210} unit="%" width={64} />
                                )}
                            </div>
                        </Card>

                        <Card
                            title="Your Class Rank"
                            subtitle={myRank ? `Top ${Math.round((myRank.rank / myRank.total) * 100)}% of the class` : 'No leaderboard yet'}
                            pad={false}
                            action={
                                <Link to="/student/analytics/rank" className="text-xs font-medium text-ink hover:text-gold">
                                    View details
                                </Link>
                            }
                        >
                            <div className="p-5 sm:p-6">
                                {myRank ? (
                                    <>
                                        <PassDonut
                                            data={[
                                                { name: 'Your avg', value: Math.round(myRank.avg ?? 0) },
                                                { name: 'Remaining', value: 100 - Math.round(myRank.avg ?? 0) },
                                            ]}
                                            centerLabel={`#${myRank.rank}`}
                                            centerSub={`of ${myRank.total}`}
                                            height={200}
                                            colors={[CHART_COLORS.gold, CHART_COLORS.border]}
                                        />
                                        <p className="mt-2 text-center text-xs text-muted">
                                            Ranked <span className="font-semibold text-ink2">#{myRank.rank}</span> of{' '}
                                            {myRank.total} students with {Math.round(myRank.avg ?? 0)}% avg
                                        </p>
                                    </>
                                ) : (
                                    <p className="py-12 text-center text-sm text-muted">
                                        Rank appears once scores are recorded.
                                    </p>
                                )}
                            </div>
                        </Card>

                        <Card
                            title="Content Usage"
                            subtitle="Assessments over time"
                            pad={false}
                            action={
                                <Link to="/student/analytics/subjects" className="text-xs font-medium text-ink hover:text-gold">
                                    View details
                                </Link>
                            }
                        >
                            <div className="p-5 sm:p-6">
                                {contentUsage.length === 0 ? (
                                    <p className="py-10 text-center text-sm text-muted">No activity yet.</p>
                                ) : (
                                    <Sparkline data={contentUsage} height={80} />
                                )}
                            </div>
                        </Card>

                        <Card
                            title="Attendance"
                            subtitle={`${attendance?.total ?? 0} records`}
                            pad={false}
                            action={
                                <Link to="/student/analytics/attendance" className="text-xs font-medium text-ink hover:text-gold">
                                    View details
                                </Link>
                            }
                        >
                            <div className="p-5 sm:p-6">
                                {attendancePie.length === 0 ? (
                                    <p className="py-10 text-center text-sm text-muted">No attendance yet.</p>
                                ) : (
                                    <>
                                        <PassDonut
                                            data={attendancePie}
                                            centerLabel={`${attendanceRate}%`}
                                            centerSub="Present"
                                            height={200}
                                            colors={[
                                                CHART_COLORS.success,
                                                CHART_COLORS.danger,
                                                CHART_COLORS.warning,
                                            ]}
                                        />
                                        <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs">
                                            {attendancePie.map((d) => {
                                                const color =
                                                    d.name === 'Present'
                                                        ? CHART_COLORS.success
                                                        : d.name === 'Absent'
                                                          ? CHART_COLORS.danger
                                                          : CHART_COLORS.warning;
                                                return (
                                                    <span key={d.name} className="flex items-center gap-1.5">
                                                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                                                        {d.name} · {d.value}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                        <Card
                            title="You vs Class Average"
                            subtitle="Your standing against classmates per subject"
                            action={
                                <Link to="/student/analytics/comparison" className="text-xs font-medium text-ink hover:text-gold">
                                    View details
                                </Link>
                            }
                        >
                            <div className="min-w-0">
                                {vsClass.length === 0 ? (
                                    <p className="py-12 text-center text-sm text-muted">
                                        Comparisons appear once scores are available.
                                    </p>
                                ) : (
                                    <GroupedBars
                                        data={vsClass}
                                        height={240}
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

                        <Card
                            title="Homework Overview"
                            subtitle="Your pending & upcoming tasks"
                            action={
                                overallDelta != null ? (
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                            overallDelta > 0
                                                ? 'bg-success/10 text-success'
                                                : overallDelta < 0
                                                  ? 'bg-danger/10 text-danger'
                                                  : 'bg-muted/10 text-muted'
                                        }`}
                                    >
                                        {overallDelta > 0 ? '▲' : overallDelta < 0 ? '▼' : '◆'} {Math.abs(overallDelta)}%
                                        {overallDelta > 0 ? ' improved' : overallDelta < 0 ? ' declined' : ' same'}
                                    </span>
                                ) : undefined
                            }
                        >
                            {homeworks.length === 0 ? (
                                <p className="py-12 text-center text-sm text-muted">No homework assigned yet.</p>
                            ) : (
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div className="rounded-xl bg-danger/10 px-3 py-4">
                                        <p className="data-figure font-display text-2xl font-semibold text-danger">
                                            {homeworkStats.overdue}
                                        </p>
                                        <p className="mt-1 text-xs text-muted">Overdue</p>
                                    </div>
                                    <div className="rounded-xl bg-warning/10 px-3 py-4">
                                        <p className="data-figure font-display text-2xl font-semibold text-warning">
                                            {homeworkStats.dueToday}
                                        </p>
                                        <p className="mt-1 text-xs text-muted">Due today</p>
                                    </div>
                                    <div className="rounded-xl bg-success/10 px-3 py-4">
                                        <p className="data-figure font-display text-2xl font-semibold text-success">
                                            {homeworkStats.upcoming}
                                        </p>
                                        <p className="mt-1 text-xs text-muted">Upcoming</p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                        <Card
                            title="Subject Performance"
                            subtitle="Average percentage per subject"
                            action={
                                <Link to="/student/analytics/subjects" className="text-xs font-medium text-ink hover:text-gold">
                                    View details
                                </Link>
                            }
                        >
                            <div className="min-w-0">
                                {subjectPerformanceData.length === 0 ? (
                                    <p className="py-12 text-center text-sm text-muted">No scores recorded yet.</p>
                                ) : (
                                    <CategoryBars data={subjectPerformanceData} height={240} unit="%" categoryWidth={84} />
                                )}
                            </div>
                        </Card>

                        <Card
                            title="Progress Over Time"
                            subtitle="Current vs previous semester average per subject"
                            action={
                                <Link to="/student/analytics/progress" className="text-xs font-medium text-ink hover:text-gold">
                                    View details
                                </Link>
                            }
                        >
                            <div className="min-w-0">
                                {progressData.length === 0 ? (
                                    <p className="py-12 text-center text-sm text-muted">
                                        Progress appears when you have marks in two semesters.
                                    </p>
                                ) : (
                                    <GroupedBars
                                        data={progressData}
                                        height={240}
                                        unit="%"
                                        series={[
                                            { key: 'Previous', color: CHART_COLORS.muted },
                                            { key: 'Current', color: CHART_COLORS.success },
                                        ]}
                                    />
                                )}
                            </div>
                        </Card>
                    </div>

                    <NoticesTasks announcements={announcements} homeworks={homeworks} />
                </>
            )}
        </div>
    );
}