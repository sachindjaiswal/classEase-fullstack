import { useEffect, useState } from 'react';
import { getClasses } from '@/api/classes';
import { getAttendanceByClass } from '@/api/attendance';
import type { SchoolClass, AttendanceItem } from '@/types';

export default function ViewAttendance() {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getClasses()
            .then((res) => {
                setClasses(res.data.classes);
                if (res.data.classes.length > 0)
                    setSelectedClassId(res.data.classes[0].id);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (selectedClassId === null) return;
        setLoading(true);
        setError(null);

        getAttendanceByClass(selectedClassId, date)
            .then((res) => setAttendance(res.data.attendance))
            .catch(() => setError("Couldn't load attendance."))
            .finally(() => setLoading(false));
    }, [selectedClassId, date]);

    const presentCount = attendance.filter((a) => a.status === 'present').length;
    const absentCount = attendance.filter((a) => a.status === 'absent').length;
    const lateCount = attendance.filter((a) => a.status === 'late').length;
    const unmarkedCount = attendance.filter((a) => a.status === null).length;

    const statusColor = (status: string | null) => {
        if (status === 'present') return 'bg-success/10 text-success';
        if (status === 'absent') return 'bg-danger/10 text-danger';
        if (status === 'late') return 'bg-warning/10 text-warning';
        return 'bg-muted/10 text-muted';
    };

    return (
        <div>
            <div>
                <h1 className="text-2xl font-semibold text-ink2">View Attendance</h1>
                <p className="mt-1 text-sm text-muted">Check attendance records by class and date</p>
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
                <label className="flex max-w-xs flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink2">Class</span>
                    <select
                        value={selectedClassId ?? ''}
                        onChange={(e) => setSelectedClassId(Number(e.target.value))}
                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                    >
                        {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.class_name} — {c.section}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex max-w-xs flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink2">Date</span>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                    />
                </label>
            </div>

            {attendance.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
                    <span>Total: <strong className="text-ink2">{attendance.length}</strong></span>
                    <span>Present: <strong className="text-success">{presentCount}</strong></span>
                    <span>Absent: <strong className="text-danger">{absentCount}</strong></span>
                    <span>Late: <strong className="text-warning">{lateCount}</strong></span>
                    {unmarkedCount > 0 && (
                        <span>Unmarked: <strong className="text-muted">{unmarkedCount}</strong></span>
                    )}
                </div>
            )}

            <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
                {loading && <p className="p-6 text-sm text-muted">Loading attendance...</p>}
                {error && <p className="p-6 text-sm text-danger">{error}</p>}

                {!loading && !error && attendance.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-ink2">No attendance records</p>
                        <p className="mt-1 text-sm text-muted">
                            No attendance has been marked for this class on this date.
                        </p>
                    </div>
                )}

                {!loading && !error && attendance.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-base text-xs uppercase tracking-wide text-muted">
                                <tr>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Name</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium text-center">Status</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {attendance.map((a) => (
                                    <tr key={a.student_id} className="hover:bg-base/60">
                                        <td className="whitespace-nowrap px-5 py-3 font-medium text-ink2">
                                            {a.firstName} {a.surname}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-center">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(a.status)}`}>
                                                {a.status ? a.status.charAt(0).toUpperCase() + a.status.slice(1) : 'Unmarked'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-muted">
                                            {a.remarks || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
