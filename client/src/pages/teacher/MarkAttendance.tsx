import { useEffect, useMemo, useState } from 'react';
import { getTeacherMe, getTeacherSubjects } from '@/api/teachers';
import { getStudentsByClass } from '@/api/students';
import { markAttendance, getAttendanceByClass } from '@/api/attendance';
import type { Student, AttendanceStatus } from '@/types';
import Button from '@/components/Button';

interface TeacherClass {
    id: number;
    class_name: string;
    section: string;
}

interface StudentAttendance {
    student_id: number;
    firstName: string;
    surname: string;
    status: AttendanceStatus;
    remarks: string;
}

export default function TeacherMarkAttendance() {
    const [classes, setClasses] = useState<TeacherClass[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState<StudentAttendance[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        getTeacherMe()
            .then((res) => getTeacherSubjects(res.data.id))
            .then((subjectsRes) => {
                const classMap = new Map<number, TeacherClass>();
                (subjectsRes.data.subjects ?? []).forEach((s) => {
                    if (s.class) {
                        const c = s.class as unknown as TeacherClass;
                        classMap.set(c.id, { id: c.id, class_name: c.class_name, section: c.section });
                    }
                });
                const list = Array.from(classMap.values());
                setClasses(list);
                if (list.length > 0) setSelectedClassId(list[0].id);
            })
            .catch(() => setMessage({ type: 'error', text: "Couldn't load your classes." }));
    }, []);

    useEffect(() => {
        if (selectedClassId === null) return;
        setLoading(true);
        setMessage(null);

        Promise.all([
            getStudentsByClass(selectedClassId),
            getAttendanceByClass(selectedClassId, date),
        ])
            .then(([studentsRes, attendanceRes]) => {
                const existingMap = new Map(
                    attendanceRes.data.attendance.map((a) => [a.student_id, a])
                );

                const merged: StudentAttendance[] = studentsRes.data.map((s: Student) => {
                    const existing = existingMap.get(s.id);
                    return {
                        student_id: s.id,
                        firstName: s.firstName,
                        surname: s.surname,
                        status: (existing?.status ?? 'present') as AttendanceStatus,
                        remarks: existing?.remarks ?? '',
                    };
                });

                setStudents(merged);
            })
            .catch(() => setMessage({ type: 'error', text: "Couldn't load students." }))
            .finally(() => setLoading(false));
    }, [selectedClassId, date]);

    const updateStatus = (studentId: number, status: AttendanceStatus) => {
        setStudents((prev) =>
            prev.map((s) => (s.student_id === studentId ? { ...s, status } : s))
        );
    };

    const handleSave = async () => {
        if (selectedClassId === null || students.length === 0) return;
        setSaving(true);
        setMessage(null);

        try {
            await markAttendance({
                class_id: selectedClassId,
                date,
                attendances: students.map((s) => ({
                    student_id: s.student_id,
                    status: s.status,
                    remarks: s.remarks || undefined,
                })),
            });
            setMessage({ type: 'success', text: 'Attendance saved successfully!' });
        } catch {
            setMessage({ type: 'error', text: 'Failed to save attendance.' });
        } finally {
            setSaving(false);
        }
    };

    const presentCount = students.filter((s) => s.status === 'present').length;
    const absentCount = students.filter((s) => s.status === 'absent').length;
    const lateCount = students.filter((s) => s.status === 'late').length;

    const classLabel = useMemo(
        () => classes.find((c) => c?.id === selectedClassId),
        [classes, selectedClassId],
    );

    return (
        <div>
            <div>
                <h1 className="text-2xl font-semibold text-ink2">Mark Attendance</h1>
                <p className="mt-1 text-sm text-muted">
                    Record daily attendance for your classes
                </p>
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
                <label className="flex max-w-xs flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink2">Class</span>
                    <select
                        value={selectedClassId ?? ''}
                        onChange={(e) => setSelectedClassId(Number(e.target.value))}
                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                        disabled={classes.length === 0}
                    >
                        {classes.length === 0 && <option value="">No classes assigned</option>}
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

                <Button onClick={handleSave} disabled={saving || loading || students.length === 0}>
                    {saving ? 'Saving...' : 'Save Attendance'}
                </Button>
            </div>

            {classLabel && (
                <p className="mt-2 text-xs text-muted">Class: {classLabel.class_name}</p>
            )}

            {message && (
                <p className={`mt-3 text-sm ${message.type === 'success' ? 'text-success' : 'text-danger'}`}>
                    {message.text}
                </p>
            )}

            {students.length > 0 && (
                <div className="mt-4 flex gap-4 text-xs text-muted">
                    <span>Present: <strong className="text-success">{presentCount}</strong></span>
                    <span>Absent: <strong className="text-danger">{absentCount}</strong></span>
                    <span>Late: <strong className="text-warning">{lateCount}</strong></span>
                </div>
            )}

            <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
                {loading && <p className="p-6 text-sm text-muted">Loading students...</p>}

                {!loading && classes.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-ink2">No classes assigned to you</p>
                        <p className="mt-1 text-xs text-muted">
                            You'll be able to mark attendance once you're assigned to a class.
                        </p>
                    </div>
                )}

                {!loading && classes.length > 0 && students.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-ink2">No students in this class</p>
                    </div>
                )}

                {!loading && students.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-base text-xs uppercase tracking-wide text-muted">
                                <tr>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Name</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {students.map((s) => (
                                    <tr key={s.student_id} className="hover:bg-base/60">
                                        <td className="whitespace-nowrap px-5 py-3 font-medium text-ink2">
                                            {s.firstName} {s.surname}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                {(['present', 'absent', 'late'] as AttendanceStatus[]).map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => updateStatus(s.student_id, status)}
                                                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                                            s.status === status
                                                                ? status === 'present'
                                                                    ? 'bg-success text-white'
                                                                    : status === 'absent'
                                                                        ? 'bg-danger text-white'
                                                                        : 'bg-warning text-white'
                                                                : 'bg-base text-muted hover:bg-border'
                                                        }`}
                                                    >
                                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
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
