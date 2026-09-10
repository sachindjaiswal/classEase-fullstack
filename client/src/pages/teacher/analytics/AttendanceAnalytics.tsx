import { useEffect, useMemo, useState } from 'react';
import AnalyticsHeader from '@/pages/analytics/AnalyticsHeader';
import StatCard from '@/pages/analytics/StatCard';
import DataTable from '@/pages/analytics/DataTable';
import { useTeacherData } from '@/pages/analytics/useTeacherData';
import { classLabel, localYmd, truncateLabel } from '@/pages/analytics/metrics';
import { getAttendanceByClass } from '@/api/attendance';
import Card from '@/components/dashboard/Card';
import PassDonut from '@/components/dashboard/PassDonut';
import { CHART_COLORS } from '@/components/charts/palette';
import type { AttendanceItem } from '@/types';

export default function TeacherAttendanceAnalytics() {
    const { subjects, classes, loading, error } = useTeacherData();
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [date, setDate] = useState<string>(() => localYmd(new Date()));
    const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
    const [attLoading, setAttLoading] = useState(false);

    useEffect(() => {
        if (subjects.length > 0 && selectedClassId === null) {
            setSelectedClassId(subjects[0].classId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subjects]);

    useEffect(() => {
        if (selectedClassId === null) return;
        let cancelled = false;
        setAttLoading(true);
        getAttendanceByClass(selectedClassId, date)
            .then((r) => {
                if (!cancelled) setAttendance(r.data.attendance ?? []);
            })
            .catch(() => {
                if (!cancelled) setAttendance([]);
            })
            .finally(() => {
                if (!cancelled) setAttLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [selectedClassId, date]);

    const counts = useMemo(() => {
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

    const rate = useMemo(
        () => (counts.total ? Math.round((counts.present / counts.total) * 100) : 0),
        [counts],
    );

    const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null;

    const classSelect = (
        <select
            value={selectedClassId ?? ''}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
            className="max-w-[200px] rounded-lg border border-border bg-surface px-2 py-1 text-xs text-ink2 outline-none"
        >
            {Array.from(new Set(subjects.map((s) => s.classId))).map((cid) => {
                const c = classes.find((k) => k.id === cid);
                return (
                    <option key={cid} value={cid}>
                        {c ? classLabel(c.class_name, c.section) : `Class #${cid}`}
                    </option>
                );
            })}
        </select>
    );

    const dateInput = (
        <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="max-w-[160px] rounded-lg border border-border bg-surface px-2 py-1 text-xs text-ink2 outline-none"
        />
    );

    if (loading) return <p className="text-sm text-muted">Loading...</p>;
    if (error) return <p className="text-sm text-danger">{error}</p>;

    return (
        <div className="min-w-0 space-y-6">
            <AnalyticsHeader
                backTo="/teacher/dashboard"
                title="Attendance in Detail"
                subtitle={`Attendance register for ${selectedClass ? classLabel(selectedClass.class_name, selectedClass.section) : 'your class'} on ${date}.`}
                children={
                    <>
                        {classSelect}
                        {dateInput}
                    </>
                }
            />

            <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-4">
                <StatCard label="Present" value={counts.present} color={CHART_COLORS.success} />
                <StatCard label="Absent" value={counts.absent} color={CHART_COLORS.danger} />
                <StatCard label="Late" value={counts.late} color={CHART_COLORS.warning} />
                <StatCard label="Presence Rate" value={counts.total ? `${rate}%` : '—'} color={CHART_COLORS.blue} />
            </div>

            <Card title="Attendance Split" subtitle={`${counts.total} students recorded on ${date}`} pad={false}>
                <div className="p-5 sm:p-6">
                    {counts.total === 0 ? (
                        <p className="py-12 text-center text-sm text-muted">No attendance marked for this date yet.</p>
                    ) : (
                        <>
                            <PassDonut
                                data={[
                                    { name: 'Present', value: counts.present },
                                    { name: 'Absent', value: counts.absent },
                                    { name: 'Late', value: counts.late },
                                ]}
                                centerLabel={`${rate}%`}
                                centerSub="Present"
                                height={220}
                                colors={[CHART_COLORS.success, CHART_COLORS.danger, CHART_COLORS.warning]}
                            />
                            <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs">
                                {[
                                    { n: 'Present', v: counts.present, c: CHART_COLORS.success },
                                    { n: 'Absent', v: counts.absent, c: CHART_COLORS.danger },
                                    { n: 'Late', v: counts.late, c: CHART_COLORS.warning },
                                ]
                                    .filter((d) => d.v > 0)
                                    .map((d) => (
                                        <span key={d.n} className="flex items-center gap-1.5">
                                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.c }} />
                                            {d.n} · {d.v}
                                        </span>
                                    ))}
                            </div>
                        </>
                    )}
                </div>
            </Card>

            <Card title="Student Register" subtitle="Individual status for each student" pad={false}>
                <div className="p-4 sm:p-5">
                    {attLoading ? (
                        <p className="py-10 text-center text-sm text-muted">Loading register...</p>
                    ) : (
                        <DataTable<AttendanceItem>
                            data={attendance}
                            keyFor={(r) => r.student_id}
                            empty="No attendance marked for this date yet."
                            columns={[
                                {
                                    header: 'Student',
                                    render: (r) => (
                                        <span className="font-medium text-ink2">
                                            {r.firstName} {r.surname}
                                        </span>
                                    ),
                                },
                                {
                                    header: 'Status',
                                    render: (r) => {
                                        const c =
                                            r.status === 'present'
                                                ? CHART_COLORS.success
                                                : r.status === 'absent'
                                                  ? CHART_COLORS.danger
                                                  : r.status === 'late'
                                                    ? CHART_COLORS.warning
                                                    : CHART_COLORS.muted;
                                        return (
                                            <span
                                                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
                                                style={{ background: `${c}1a`, color: c }}
                                            >
                                                <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                                                {r.status ?? 'Not marked'}
                                            </span>
                                        );
                                    },
                                },
                                { header: 'Remarks', className: 'hidden md:table-cell', render: (r) => <span className="text-muted">{r.remarks ?? '—'}</span> },
                            ]}
                        />
                    )}
                </div>
            </Card>
        </div>
    );
}