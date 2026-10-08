import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import NoticesTasks from '@/components/NoticesTasks';
import { getDashboardStats, getDashboardFeed } from '@/api/dashboard';
import { getClasses } from '@/api/classes';
import { getStudentsByClass } from '@/api/students';
import { getScoresByClass } from '@/api/scores';
import { getTeachers } from '@/api/teachers';
import HeroBanner, { KpiBadge } from '@/components/dashboard/HeroBanner';
import Card from '@/components/dashboard/Card';
import ListRow from '@/components/dashboard/ListRow';
import TrendChart from '@/components/dashboard/TrendChart';
import Top5Bar from '@/components/dashboard/Top5Bar';
import CategoryBars from '@/components/dashboard/CategoryBars';
import PassDonut from '@/components/dashboard/PassDonut';
import Sparkline from '@/components/dashboard/Sparkline';
import { ICONS } from '@/components/dashboard/icons';
import { CHART_COLORS } from '@/components/charts/palette';
import type {
    Announcement,
    DashboardStats,
    Homework,
    SchoolClass,
    ScoreFull,
    Student,
    Teacher,
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

function subjectLabel(s: ScoreFull): string {
    return s.subject?.subjectName ?? `Subject #${s.subject_id}`;
}

export default function ManagementDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [homeworks, setHomeworks] = useState<Homework[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [studentsByClass, setStudentsByClass] = useState<Record<number, number>>({});
    const [scoresByClass, setScoresByClass] = useState<Record<number, DatedScore[]>>({});
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const statsRes = await getDashboardStats();
                const [feedRes, classesRes, teachersRes] = await Promise.all([
                    getDashboardFeed(),
                    getClasses(),
                    getTeachers(),
                ]);

                const classList: SchoolClass[] = classesRes.data.classes;
                const studentCalls = classList.map((c) =>
                    getStudentsByClass(c.id).then((r) => ({ id: c.id, students: r.data as Student[] })),
                );
                const scoreCalls = classList.map((c) =>
                    getScoresByClass(c.id).then((r) => ({
                        id: c.id,
                        scores: r.data.scores as unknown as DatedScore[],
                    })),
                );
                const [studentResults, scoreResults] = await Promise.all([
                    Promise.all(studentCalls),
                    Promise.all(scoreCalls),
                ]);

                if (cancelled) return;
                setStats(statsRes.data);
                setAnnouncements(feedRes.data.announcements);
                setHomeworks(feedRes.data.homeworks);
                setClasses(classList);
                setTeachers(teachersRes.data);
                setStudentsByClass(
                    Object.fromEntries(studentResults.map((r) => [r.id, r.students.length])),
                );
                setScoresByClass(Object.fromEntries(scoreResults.map((r) => [r.id, r.scores])));
            } catch {
                if (!cancelled) setError("Couldn't load dashboard.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const allScores: DatedScore[] = useMemo(
        () => Object.values(scoresByClass).flat(),
        [scoresByClass],
    );

    const totalStudents = useMemo(
        () => Object.values(studentsByClass).reduce((a, b) => a + b, 0),
        [studentsByClass],
    );

    const popularCourses = useMemo(() => {
        const subjectMap: Record<number, { name: string; count: number; avg: number; total: number }> = {};
        allScores.forEach((sc) => {
            const entry = subjectMap[sc.subject_id] || { name: subjectLabel(sc), count: 0, avg: 0, total: 0 };
            entry.count += 1;
            entry.total += percentageOf(sc);
            subjectMap[sc.subject_id] = entry;
        });
        return Object.values(subjectMap)
            .map((e) => ({ ...e, avg: e.count ? Math.round(e.total / e.count) : 0 }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);
    }, [allScores]);

    const monthlyTrend = useMemo(() => {
        const buckets = new Map<string, { label: string; sort: string; sum: number; count: number }>();
        allScores.forEach((sc) => {
            if (!sc.created_at) return;
            const key = monthKey(sc.created_at);
            if (!key) return;
            const bucket = buckets.get(key) || {
                label: monthLabel(sc.created_at),
                sort: sc.created_at.slice(0, 7),
                sum: 0,
                count: 0,
            };
            bucket.sum += percentageOf(sc);
            bucket.count += 1;
            buckets.set(key, bucket);
        });
        return Array.from(buckets.values())
            .map((b) => ({
                label: b.label,
                value: b.count ? Math.round(b.sum / b.count) : 0,
            }))
            .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }))
            .slice(-6);
    }, [allScores]);

    const top5Subjects = useMemo(() => {
        const subjectMap: Record<number, { name: string; sum: number; count: number }> = {};
        allScores.forEach((sc) => {
            const entry = subjectMap[sc.subject_id] || { name: subjectLabel(sc), sum: 0, count: 0 };
            entry.sum += percentageOf(sc);
            entry.count += 1;
            subjectMap[sc.subject_id] = entry;
        });
        return Object.values(subjectMap)
            .map((e) => ({ label: e.name, value: e.count ? Math.round(e.sum / e.count) : 0 }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [allScores]);

    const overallPass = useMemo(() => {
        const pass = allScores.filter((s) => percentageOf(s) >= 50).length;
        const fail = allScores.length - pass;
        return {
            total: allScores.length,
            pass,
            fail,
            data: [
                { name: 'Pass', value: pass },
                { name: 'Needs work', value: Math.max(fail, 0) },
            ],
        };
    }, [allScores]);

    const contentUsage = useMemo(() => {
        const buckets = new Map<string, { label: string; count: number }>();
        allScores.forEach((sc) => {
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
    }, [allScores]);

    const contentDelta = useMemo(() => {
        if (contentUsage.length < 2) return null;
        const last = contentUsage[contentUsage.length - 1];
        const prev = contentUsage[contentUsage.length - 2];
        if (!prev.value) return null;
        const delta = ((last.value - prev.value) / prev.value) * 100;
        if (!Number.isFinite(delta)) return null;
        return delta >= 0
            ? `▲ ${delta.toFixed(1)}% more than last month`
            : `${delta.toFixed(1)}% vs last month`;
    }, [contentUsage]);

    const bestInstructors = useMemo(() => {
        const teacherMap: Record<number, { teacher: Teacher; sum: number; count: number }> = {};
        teachers.forEach((t) => {
            teacherMap[t.id] = { teacher: t, sum: 0, count: 0 };
        });
        allScores.forEach((sc) => {
            const teacherId = sc.subject?.teacherId;
            if (teacherId === undefined || teacherId === null) return;
            const entry = teacherMap[teacherId];
            if (!entry) return;
            entry.sum += percentageOf(sc);
            entry.count += 1;
        });
        return Object.values(teacherMap)
            .map((e) => ({
                teacher: e.teacher,
                avg: e.count ? Math.round(e.sum / e.count) : 0,
                count: e.count,
            }))
            .filter((e) => e.count > 0)
            .sort((a, b) => b.avg - a.avg)
            .slice(0, 5);
    }, [teachers, allScores]);

    const studentsPerClass = useMemo(
        () =>
            classes.map((c) => ({
                label: `${c.class_name}${c.section ? ` ${c.section}` : ''}`,
                value: studentsByClass[c.id] ?? 0,
            })),
        [classes, studentsByClass],
    );

    const classPerformance = useMemo(() => {
        return classes.map((c) => {
            const scores = scoresByClass[c.id] ?? [];
            let obtained = 0;
            let total = 0;
            scores.forEach((s) => {
                obtained += s.marks_obtained;
                total += s.total_marks;
            });
            return {
                label: `${c.class_name}${c.section ? ` ${c.section}` : ''}`,
                value: total ? Math.round((obtained / total) * 100) : 0,
            };
        });
    }, [classes, scoresByClass]);

    return (
        <div className="min-w-0 space-y-6">
            {loading && <p className="text-sm text-muted">Loading stats...</p>}
            {error && <p className="text-sm text-danger">{error}</p>}

            {!loading && !error && stats && (
                <>
                    <HeroBanner
                        title="Learn Effectively With Us!"
                        subtitle="Track performance, attendance and growth across every class and subject."
                    >
                        <KpiBadge
                            icon={ICONS.students}
                            label="Total Students"
                            value={totalStudents}
                            accent={CHART_COLORS.goldLight}
                        />
                        <KpiBadge
                            icon={ICONS.mentors}
                            label="Expert Mentors"
                            value={stats.teachers}
                            accent={CHART_COLORS.gold}
                        />
                        <KpiBadge
                            icon={ICONS.classes}
                            label="Active Classes"
                            value={stats.classes}
                            accent={CHART_COLORS.success}
                        />
                        <KpiBadge
                            icon={ICONS.book}
                            label="Subjects"
                            value={stats.subjects}
                            accent={CHART_COLORS.warning}
                        />
                    </HeroBanner>

                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-6 xl:grid-cols-12">
                        <Card
                            title="Popular Courses"
                            subtitle="Subjects ranked by assessment volume"
                            className="md:col-span-3 xl:col-span-3"
                            pad={false}
                            action={
                                <Link to="/management/subjects" className="text-xs font-medium text-ink hover:text-gold">
                                    View subjects
                                </Link>
                            }
                        >
                            <div className="flex min-w-0 flex-col gap-2 p-4 sm:p-5">
                                {popularCourses.length === 0 && (
                                    <p className="py-8 text-center text-sm text-muted">No courses yet.</p>
                                )}
                                {popularCourses.map((c) => (
                                    <ListRow
                                        key={c.name}
                                        icon={ICONS.book}
                                        iconBg="bg-gold/10"
                                        iconColor="text-gold-dark"
                                        title={c.name}
                                        subtitle={`${c.count} assessments • ${c.avg}% avg`}
                                    />
                                ))}
                            </div>
                        </Card>

                        <Card
                            title="Current Activity"
                            subtitle="Average score % per month"
                            className="md:col-span-6 xl:col-span-6"
                            pad={false}
                            action={
                                <Link to="/management/analytics/activity" className="text-xs font-medium text-ink hover:text-gold">
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
                            subtitle="Across all assessments"
                            className="md:col-span-3 xl:col-span-3"
                            pad={false}
                            action={
                                <Link to="/management/analytics/class-performance" className="text-xs font-medium text-ink hover:text-gold">
                                    View details
                                </Link>
                            }
                        >
                            <div className="p-5 sm:p-6">
                                <PassDonut
                                    data={overallPass.data}
                                    centerLabel={
                                        overallPass.total
                                            ? `${Math.round((overallPass.pass / overallPass.total) * 100)}%`
                                            : '—'
                                    }
                                    centerSub="Overall"
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

                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
                        <Card
                            title="Top 5 School Performance"
                            subtitle="Best subjects by average %"
                            pad={false}
                            action={
                                <Link to="/management/analytics/subjects" className="text-xs font-medium text-ink hover:text-gold">
                                    View details
                                </Link>
                            }
                        >
                            <div className="min-w-0 p-4 sm:p-5">
                                {top5Subjects.length === 0 ? (
                                    <p className="py-12 text-center text-sm text-muted">No scores yet.</p>
                                ) : (
                                    <Top5Bar data={top5Subjects} height={220} unit="%" width={72} />
                                )}
                            </div>
                        </Card>

                        <Card
                            title="Students per Class"
                            subtitle="Current class sizes"
                            pad={false}
                            action={
                                <Link to="/management/analytics/class-performance" className="text-xs font-medium text-ink hover:text-gold">
                                    View details
                                </Link>
                            }
                        >
                            <div className="min-w-0 p-4 sm:p-5">
                                {studentsPerClass.length === 0 ? (
                                    <p className="py-12 text-center text-sm text-muted">No classes yet.</p>
                                ) : (
                                    <CategoryBars
                                        data={studentsPerClass}
                                        height={220}
                                        domain={[0, 'auto']}
                                        categoryWidth={72}
                                    />
                                )}
                            </div>
                        </Card>

                        <Card
                            title="Content Usage"
                            subtitle="Assessments recorded over time"
                            pad={false}
                            action={
                                <Link to="/management/analytics/activity" className="text-xs font-medium text-ink hover:text-gold">
                                    View details
                                </Link>
                            }
                        >
                            <div className="p-5 sm:p-6">
                                {contentDelta && (
                                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                                        {contentDelta}
                                    </div>
                                )}
                                {contentUsage.length === 0 ? (
                                    <p className="py-10 text-center text-sm text-muted">No activity yet.</p>
                                ) : (
                                    <Sparkline data={contentUsage} height={80} />
                                )}
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                        <Card
                            title="Class Performance"
                            subtitle="Average percentage per class"
                            action={
                                <Link to="/management/analytics/class-performance" className="text-xs font-medium text-ink hover:text-gold">
                                    View details
                                </Link>
                            }
                        >
                            <div className="min-w-0">
                                {classPerformance.length === 0 ? (
                                    <p className="py-12 text-center text-sm text-muted">No scores recorded yet.</p>
                                ) : (
                                    <CategoryBars data={classPerformance} height={240} unit="%" categoryWidth={88} />
                                )}
                            </div>
                        </Card>

                        <Card
                            title="Best Instructors"
                            subtitle="Ranked by subject average %"
                            pad={false}
                            action={
                                <Link to="/management/analytics/instructors" className="text-xs font-medium text-ink hover:text-gold">
                                    View details
                                </Link>
                            }
                        >
                            <div className="flex min-w-0 flex-col gap-2 p-4 sm:p-5">
                                {bestInstructors.length === 0 && (
                                    <p className="py-8 text-center text-sm text-muted">No teachers with scores yet.</p>
                                )}
                                {bestInstructors.map(({ teacher, avg, count }) => (
                                    <ListRow
                                        key={teacher.id}
                                        icon={
                                            <span className="font-display text-sm font-bold">
                                                {teacher.first_name.charAt(0)}
                                                {teacher.surname.charAt(0)}
                                            </span>
                                        }
                                        iconBg="bg-gold/10"
                                        iconColor="text-gold-dark"
                                        title={`${teacher.first_name} ${teacher.surname}`}
                                        subtitle={`${count} assessments ranked`}
                                        trailing={`${avg}%`}
                                    />
                                ))}
                            </div>
                        </Card>
                    </div>

                    <NoticesTasks announcements={announcements} homeworks={homeworks} />
                </>
            )}
        </div>
    );
}