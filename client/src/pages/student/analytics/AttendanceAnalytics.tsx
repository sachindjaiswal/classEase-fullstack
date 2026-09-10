import { useEffect, useMemo, useState } from 'react';
import AnalyticsHeader from '@/pages/analytics/AnalyticsHeader';
import StatCard from '@/pages/analytics/StatCard';
import DataTable from '@/pages/analytics/DataTable';
import { useStudentData } from '@/pages/analytics/useStudentData';
import { getStudentAttendance } from '@/api/attendance';
import Card from '@/components/dashboard/Card';
import PassDonut from '@/components/dashboard/PassDonut';
import { CHART_COLORS } from '@/components/charts/palette';
import type { AttendanceRecord, AttendanceSummary } from '@/types';

export default function StudentAttendanceAnalytics() {
    const { student, loading: studentLoading, error: studentError } = useStudentData();
    const [summary, setSummary] = useState<AttendanceSummary | null>(null);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!student) return;
        let cancelled = false;
        setLoading(true);
        getStudentAttendance(student.id)
            .then((r) => {
                if (!cancelled) {
                    setSummary(r.data.summary ?? null);
                    setRecords(r.data.attendance ?? []);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setSummary(null);
                    setRecords([]);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [student]);

    const rate = useMemo(() => {
        if (!summary || summary.total === 0) return 0;
        return Math.round((summary.present / summary.total) * 100);
    }, [summary]);

    const pie = useMemo(
        () =>
            [
                { name: 'Present', value: summary?.present ?? 0 },
                { name: 'Absent', value: summary?.absent ?? 0 },
                { name: 'Late', value: summary?.late ?? 0 },
            ].filter((d) => d.value > 0),
        [summary],
    );

    if (studentLoading) return <p className="text-sm text-muted">Loading...</p>;
    if (studentError) return <p className="text-sm text-danger">{studentError}</p>;

    return (
        <div className="min-w-0 space-y-6">
            <AnalyticsHeader
                backTo="/student/dashboard"
                title="Attendance in Detail"
                subtitle={student ? `Your full attendance history, ${student.firstName} ${student.surname}.` : 'Your full attendance history.'}
            />

            <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-4">
                <StatCard label="Days Recorded" value={summary?.total ?? 0} color={CHART_COLORS.blue} />
                <StatCard label="Presence Rate" value={summary?.total ? `${rate}%` : '—'} color={rate >= 75 ? CHART_COLORS.success : rate >= 50 ? CHART_COLORS.warning : CHART_COLORS.danger} />
                <StatCard label="Absences" value={summary?.absent ?? 0} color={CHART_COLORS.danger} />
                <StatCard label="Late Arrivals" value={summary?.late ?? 0} color={CHART_COLORS.warning} />
            </div>

            <Card title="Attendance Split" subtitle="Your overall present/absent/late breakdown" pad={false}>
                <div className="p-5 sm:p-6">
                    {pie.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted">No attendance recorded yet.</p>
                    ) : (
                        <>
                            <PassDonut
                                data={pie}
                                centerLabel={`${rate}%`}
                                centerSub="Present"
                                height={220}
                                colors={[CHART_COLORS.success, CHART_COLORS.danger, CHART_COLORS.warning]}
                            />
                            <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs">
                                {pie.map((d) => {
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

            <Card title="Attendance History" subtitle="Every recorded day with its status" pad={false}>
                <div className="p-4 sm:p-5">
                    {loading ? (
                        <p className="py-10 text-center text-sm text-muted">Loading history...</p>
                    ) : (
                        <DataTable<AttendanceRecord>
                            data={records}
                            keyFor={(r) => r.id}
                            empty="No attendance recorded yet."
                            columns={[
                                { header: 'Date', render: (r) => <span className="font-medium text-ink2">{r.date}</span> },
                                {
                                    header: 'Status',
                                    render: (r) => {
                                        const c =
                                            r.status === 'present'
                                                ? CHART_COLORS.success
                                                : r.status === 'absent'
                                                  ? CHART_COLORS.danger
                                                  : CHART_COLORS.warning;
                                        return (
                                            <span
                                                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
                                                style={{ background: `${c}1a`, color: c }}
                                            >
                                                <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                                                {r.status}
                                            </span>
                                        );
                                    },
                                },
                                { header: 'Remarks', className: 'hidden md:table-cell', render: (r) => <span className="text-muted">{r.remarks ?? '—'}</span> },
                                { header: 'Class', className: 'hidden lg:table-cell', render: (r) => <span className="text-muted">{r.class?.class_name ?? '—'}</span> },
                            ]}
                        />
                    )}
                </div>
            </Card>
        </div>
    );
}