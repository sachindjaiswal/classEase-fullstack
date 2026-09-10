import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getTeacher, getTeacherMe, getTeacherSubjects } from '@/api/teachers';
import { getDashboardFeed } from '@/api/dashboard';
import { getScoresByClass } from '@/api/scores';
import { getAttendanceByClass } from '@/api/attendance';
import NoticesTasks from '@/components/NoticesTasks';
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
import type { Announcement, AttendanceItem, Homework, ScoreFull, SubjectFull, Teacher } from '@/types';

type DatedScore = ScoreFull & { created_at?: string };

function localYmd(d: Date): string {
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
}

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

export default function TeacherDashboard() {
    const { user } = useAuth();
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [subjects, setSubjects] = useState<SubjectFull[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [homeworks, setHomeworks] = useState<Homework[]>([]);
    const [scores, setScores] = useState<DatedScore[]>([]);
    const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<number | null>(null);

    const today = localYmd(new Date());

    useEffect(() => {
        if (!user) return;

        let cancelled = false;
        (async () => {
            try {
                const me = await getTeacherMe();
                const [teacherRes, subjectsRes, feedRes] = await Promise.all([
                    getTeacher(me.data.id),
                    getTeacherSubjects(me.data.id),
                    getDashboardFeed(),
                ]);
                const subjectList = subjectsRes.data.subjects;
                if (cancelled) return;
                setTeacher(teacherRes.data);
                setSubjects(subjectList);
                setAnnouncements(feedRes.data.announcements);
                setHomeworks(feedRes.data.homeworks);

                if (!subjectList || subjectList.length === 0) return;
                const first = subjectList[0];
                setSelectedSubject(first.id);
                const [scoresRes, attRes] = await Promise.all([
                    getScoresByClass(first.classId),
                    getAttendanceByClass(first.classId, today),
                ]);
                if (cancelled) return;
                setScores(scoresRes.data.scores as unknown as DatedScore[]);
                setAttendance(attRes.data.attendance);
            } catch {
                if (!cancelled) setError("Couldn't load dashboard data.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, today]);

    const subjectAverages = useMemo(() => {
        const map: Record<number, { name: string; percent: number; count: number }> = {};
        scores.forEach((sc) => {
            if (!subjects.some((s) => s.id === sc.subject_id)) return;
            const name = sc.subject?.subjectName ?? `Subject #${sc.subject_id}`;
            if (!map[sc.subject_id]) map[sc.subject_id] = { name, percent: 0, count: 0 };
            map[sc.subject_id].percent += percentageOf(sc);
            map[sc.subject_id].count += 1;
        });
        return Object.values(map).map((v) => ({
            name: v.name,
            percent: v.count ? Math.round(v.percent / v.count) : 0,
            count: v.count,
        }));
    }, [scores, subjects]);

    const subjectPerformanceData = useMemo(
        () => subjectAverages.map((v) => ({ label: v.name, value: v.percent })),
        [subjectAverages],
    );

    const perStudent = useMemo(() => {
        if (!selectedSubject) return [];
        const map: Record<number, { name: string; sum: number; count: number }> = {};
        scores
            .filter((s) => s.subject_id === selectedSubject)
            .forEach((sc) => {
                const sid = sc.student_id;
                const name = sc.student
                    ? `${sc.student.firstName} ${sc.student.surname}`
                    : `Student #${sid}`;
                if (!map[sid]) map[sid] = { name, sum: 0, count: 0 };
                map[sid].sum += percentageOf(sc);
                map[sid].count += 1;
            });
        return Object.values(map)
            .map((v) => ({ label: v.name, value: v.count ? Math.round(v.sum / v.count) : 0 }))
            .sort((a, b) => b.value - a.value);
    }, [selectedSubject, scores]);

    const topStudents = useMemo(() => perStudent.slice(0, 5), [perStudent]);

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

    const overallPass = useMemo(() => {
        const pass = scores.filter((s) => percentageOf(s) >= 50).length;
        const fail = scores.length - pass;
        return {
            total: scores.length,
            pass,
            data: [
                { name: 'Pass', value: pass },
                { name: 'Needs work', value: Math.max(fail, 0) },
            ],
        };
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

    const attendanceCounts = useMemo(() => {
        let present = 0;
        let absent = 0;
        let late = 0;
        attendance.forEach((a) => {
            if (a.status === 'present') present += 1;
            else if (a.status === 'absent') absent += 1;
            else if (a.status === 'late') late += 1;
        });
        return { present, absent, late, total: attendance.length };
    }, [attendance]);

    const attendanceRate = useMemo(() => {
        if (attendanceCounts.total === 0) return 0;
        return Math.round((attendanceCounts.present / attendanceCounts.total) * 100);
    }, [attendanceCounts]);

    const attendancePie = useMemo(
        () =>
            [
                { name: 'Present', value: attendanceCounts.present },
                { name: 'Absent', value: attendanceCounts.absent },
                { name: 'Late', value: attendanceCounts.late },
            ].filter((d) => d.value > 0),
        [attendanceCounts],
    );

    const pendingHomeworks = useMemo(
        () => homeworks.filter((h) => (h.due_date ?? '') >= today).length,
        [homeworks, today],
    );

    const selectedSubjectName = useMemo(
        () => subjects.find((s) => s.id === selectedSubject)?.subjectName ?? 'Subject',
        [subjects, selectedSubject],
    );

    const subjectSelect = (
        <select
            value={selectedSubject ?? ''}
            onChange={(e) => setSelectedSubject(Number(e.target.value))}
            className="max-w-[140px] rounded-lg border border-border bg-surface px-2 py-1 text-xs text-ink2 outline-none"
        >
            {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                    {s.subjectName}
                </option>
            ))}
        </select>
    );

    return (
        <div className="min-w-0 space-y-6">
            {loading && <p className="text-sm text-muted">Loading...</p>}
            {error && <p className="text-sm text-danger">{error}</p>}

            {!loading && !error && teacher && (
                <>
                    <HeroBanner
                        title={`Welcome back, ${user?.name}`}
                        subtitle={`${teacher.designation} • ${subjects[0]?.class?.class_name ?? 'Your class'} • ${today}`}
                    >
                        <KpiBadge
                            icon={ICONS.book}
                            label="Subjects Taught"
                            value={subjects.length}
                            accent={CHART_COLORS.gold}
                        />
                        <KpiBadge
                            icon={ICONS.chart}
                            label="Today's Attendance"
                            value={attendanceCounts.total === 0 ? '—' : `${attendanceRate}%`}
                            accent={CHART_COLORS.success}
                        />
                        <KpiBadge
                            icon={ICONS.students}
                            label="Students in Class"
                            value={attendanceCounts.total || '—'}
                            accent={CHART_COLORS.warning}
                        />
                        <KpiBadge
                            icon={ICONS.award}
                            label="Pending Tasks"
                            value={pendingHomeworks}
                            accent={CHART_COLORS.ink}
                        />
                    </HeroBanner>

                    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-6 xl:grid-cols-12">
                        <Card
                            title="Popular Courses"
                            subtitle="Subjects you teach"
                            className="md:col-span-3 xl:col-span-3"
                            pad={false}
                            action={
                                <Link to="/teacher/scores" className="text-xs font-medium text-ink hover:text-gold">
                                    Add marks
                                </Link>
                            }
                        >
                            <div className="flex min-w-0 flex-col gap-2 p-4 sm:p-5">
                                {subjects.length === 0 && (
                                    <p className="py-8 text-center text-sm text-muted">No subjects assigned.</p>
                                )}
                                {subjects.map((s) => {
                                    const avg = subjectAverages.find((x) => x.name === s.subjectName);
                                    return (
                                        <ListRow
                                            key={s.id}
                                            icon={ICONS.book}
                                            iconBg="bg-ink/10"
                                            iconColor="text-ink"
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
                                <Link to="/teacher/analytics/class-performance" className="text-xs font-medium text-ink hover:text-gold">
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
                            subtitle="Across subjects you teach"
                            className="md:col-span-3 xl:col-span-3"
                            pad={false}
                            action={
                                <Link to="/teacher/analytics/class-performance" className="text-xs font-medium text-ink hover:text-gold">
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
                            title="Top 5 Students"
                            subtitle={selectedSubjectName}
                            pad={false}
                            action={
                                <div className="flex items-center gap-3">
                                    <Link to="/teacher/analytics/students" className="text-xs font-medium text-ink hover:text-gold">
                                        View details
                                    </Link>
                                    {subjects.length > 1 ? subjectSelect : undefined}
                                </div>
                            }
                        >
                            <div className="min-w-0 p-4 sm:p-5">
                                {topStudents.length === 0 ? (
                                    <p className="py-12 text-center text-sm text-muted">No scores yet.</p>
                                ) : (
                                    <Top5Bar data={topStudents} height={220} unit="%" width={72} />
                                )}
                            </div>
                        </Card>

                        <Card
                            title="Class Performance by Subject"
                            subtitle="Average % for subjects you teach"
                            pad={false}
                            action={
                                <Link to="/teacher/analytics/class-performance" className="text-xs font-medium text-ink hover:text-gold">
                                    View details
                                </Link>
                            }
                        >
                            <div className="min-w-0 p-4 sm:p-5">
                                {subjectPerformanceData.length === 0 ? (
                                    <p className="py-12 text-center text-sm text-muted">No scores yet.</p>
                                ) : (
                                    <CategoryBars data={subjectPerformanceData} height={220} unit="%" categoryWidth={84} />
                                )}
                            </div>
                        </Card>

                        <Card
                            title="Content Usage"
                            subtitle="Assessments recorded over time"
                            pad={false}
                            action={
                                <Link to="/teacher/analytics/class-performance" className="text-xs font-medium text-ink hover:text-gold">
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
                            title="Per-Student Performance"
                            subtitle={selectedSubjectName}
                            action={
                                <div className="flex items-center gap-3">
                                    <Link to="/teacher/analytics/students" className="text-xs font-medium text-ink hover:text-gold">
                                        View details
                                    </Link>
                                    {subjects.length > 1 ? subjectSelect : undefined}
                                </div>
                            }
                        >
                            <div className="min-w-0">
                                {perStudent.length === 0 ? (
                                    <p className="py-12 text-center text-sm text-muted">No scores for this subject yet.</p>
                                ) : (
                                    <CategoryBars data={perStudent} height={Math.min(280, Math.max(160, perStudent.length * 34))} unit="%" categoryWidth={96} />
                                )}
                            </div>
                        </Card>

                        <Card
                            title="Today's Attendance"
                            subtitle={subjects[0]?.class?.class_name ?? 'Class'}
                            pad={false}
                            action={
                                <Link to="/teacher/analytics/attendance" className="text-xs font-medium text-ink hover:text-gold">
                                    View details
                                </Link>
                            }
                        >
                            <div className="p-5 sm:p-6">
                                {attendancePie.length === 0 ? (
                                    <p className="py-10 text-center text-sm text-muted">
                                        No attendance marked for today yet.
                                    </p>
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

                    <NoticesTasks announcements={announcements} homeworks={homeworks} />
                </>
            )}
        </div>
    );
}