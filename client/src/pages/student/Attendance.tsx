import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getStudent } from '@/api/students';
import { getStudentAttendance } from '@/api/attendance';
import { createAttendanceAppeal, getMyAttendanceAppeals } from '@/api/attendanceAppeals';
import type {
    AttendanceAppeal,
    AttendanceAppealStatus,
    AttendanceRecord,
    AttendanceStatus,
} from '@/types';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';

const STATUS_ORDER: AttendanceStatus[] = ['present', 'absent', 'late'];

const APPEAL_META: Record<
    AttendanceAppealStatus,
    { badge: 'success' | 'danger' | 'warning' | 'neutral'; label: string }
> = {
    pending: { badge: 'warning', label: 'Pending' },
    approved: { badge: 'success', label: 'Approved' },
    rejected: { badge: 'danger', label: 'Rejected' },
};

const statusStyle = (status: AttendanceStatus | null) => {
    const c =
        status === 'present'
            ? { color: '#16a34a' }
            : status === 'absent'
              ? { color: '#dc2626' }
              : { color: '#d97706' };
    return {
        background: `${c.color}1a`,
        color: c.color,
    };
};

export default function StudentAttendance() {
    const { user } = useAuth();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [appeals, setAppeals] = useState<AttendanceAppeal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [draftStatus, setDraftStatus] = useState<AttendanceStatus>('absent');
    const [draftMessage, setDraftMessage] = useState('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) return;

        getStudent(user.id)
            .then((res) => {
                const studentId = res.data.student.id;
                return Promise.all([
                    getStudentAttendance(studentId),
                    getMyAttendanceAppeals(),
                ]);
            })
            .then(([attRes, appealRes]) => {
                setRecords(attRes.data.attendance);
                setAppeals(appealRes.data.corrections);
            })
            .catch(() => setError("Couldn't load your attendance."))
            .finally(() => setLoading(false));
    }, [user]);

    const pendingFor = (recordId: number) =>
        appeals.some((a) => a.attendance_id === recordId && a.status === 'pending');

    const openAppeal = (record: AttendanceRecord) => {
        if (expandedId === record.id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(record.id);
        setDraftStatus(STATUS_ORDER.find((s) => s !== record.status) ?? 'present');
        setDraftMessage('');
        setErrors({});
        setGeneralError(null);
    };

    const handleSubmit = async (e: FormEvent, record: AttendanceRecord) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        setGeneralError(null);
        try {
            const res = await createAttendanceAppeal({
                attendance_id: record.id,
                requested_status: draftStatus,
                message: draftMessage,
            });
            setAppeals((prev) => [res.data.correction, ...prev]);
            setExpandedId(null);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
            const data = axiosErr?.response?.data;
            if (data?.errors) {
                setErrors(data.errors);
            } else {
                setGeneralError(data?.message ?? 'Could not submit the appeal.');
            }
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return `${d.toLocaleDateString()}, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    };

    const formatDay = (iso: string) => {
        const d = new Date(iso);
        return Number.isNaN(d.getTime())
            ? iso
            : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const classLabel = (a: AttendanceAppeal) =>
        a.attendance?.class ? `${a.attendance.class.class_name} ${a.attendance.class.section}` : 'Class';

    return (
        <div>
            <h1 className="text-2xl font-semibold text-ink2">My Attendance</h1>
            <p className="mt-1 text-sm text-muted">View your attendance records and appeal any mistakes</p>

            {loading && <p className="mt-6 text-sm text-muted">Loading attendance...</p>}
            {error && <p className="mt-6 text-sm text-danger">{error}</p>}

            {!loading && !error && (
                <>
                    <div className="mt-6 overflow-hidden card">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-base text-xs uppercase tracking-wide text-muted">
                                    <tr>
                                        <th className="whitespace-nowrap px-5 py-3 font-medium">Date</th>
                                        <th className="whitespace-nowrap px-5 py-3 font-medium">Status</th>
                                        <th className="whitespace-nowrap px-5 py-3 font-medium">Remarks</th>
                                        <th className="whitespace-nowrap px-5 py-3 font-medium"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {records.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-5 py-10 text-center text-sm text-muted">
                                                No attendance records yet.
                                            </td>
                                        </tr>
                                    )}
                                    {records.map((r) => (
                                        <tr key={r.id} className="hover:bg-base/60">
                                            <td className="whitespace-nowrap px-5 py-3 text-ink2">{formatDay(r.date)}</td>
                                            <td className="whitespace-nowrap px-5 py-3">
                                                <span
                                                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
                                                    style={statusStyle(r.status)}
                                                >
                                                    <span
                                                        className="h-1.5 w-1.5 rounded-full"
                                                        style={{ background: statusStyle(r.status).color }}
                                                    />
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-muted">{r.remarks ?? '—'}</td>
                                            <td className="whitespace-nowrap px-5 py-3 text-right">
                                                {pendingFor(r.id) ? (
                                                    <span className="text-xs font-medium text-muted">Appeal pending</span>
                                                ) : (
                                                    <button
                                                        onClick={() => openAppeal(r)}
                                                        className="text-sm font-medium text-ink hover:underline"
                                                    >
                                                        {expandedId === r.id ? 'Close' : 'Appeal'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {expandedId !== null && expandedId > 0 && (
                        <form
                            onSubmit={(e) => {
                                const record = records.find((r) => r.id === expandedId);
                                if (record) void handleSubmit(e, record);
                            }}
                            className="mt-4 flex max-w-xl flex-col gap-4 card p-5"
                        >
                            <p className="text-sm font-semibold text-ink2">Appeal this record</p>
                            <label className="flex flex-col gap-1.5 text-sm">
                                <span className="font-medium text-ink2">Correct status</span>
                                <select
                                    value={draftStatus}
                                    onChange={(e) => setDraftStatus(e.target.value as AttendanceStatus)}
                                    className="input"
                                >
                                    {STATUS_ORDER.map((s) => (
                                        <option key={s} value={s}>
                                            {s[0].toUpperCase() + s.slice(1)}
                                        </option>
                                    ))}
                                </select>
                                {errors.requested_status && (
                                    <span className="text-xs text-danger">{errors.requested_status[0]}</span>
                                )}
                            </label>

                            <label className="flex flex-col gap-1.5 text-sm">
                                <span className="font-medium text-ink2">Reason for appeal</span>
                                <textarea
                                    value={draftMessage}
                                    onChange={(e) => setDraftMessage(e.target.value)}
                                    rows={3}
                                    placeholder="Explain why this record is incorrect..."
                                    className="input resize-none"
                                />
                                {errors.message && (
                                    <span className="text-xs text-danger">{errors.message[0]}</span>
                                )}
                            </label>
                            {generalError && <span className="text-xs text-danger">{generalError}</span>}

                            <div className="flex gap-2">
                                <Button type="submit" disabled={saving || !draftMessage.trim()}>
                                    {saving ? 'Submitting...' : 'Submit Appeal'}
                                </Button>
                                <Button variant="secondary" onClick={() => setExpandedId(null)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    )}

                    <div className="mt-8">
                        <h2 className="text-lg font-semibold text-ink2">My appeals</h2>
                        {appeals.length === 0 && (
                            <p className="mt-4 card p-6 text-sm text-muted">
                                You haven't submitted any attendance appeals yet.
                            </p>
                        )}

                        <div className="mt-4 flex flex-col gap-3">
                            {appeals.map((a) => (
                                <div key={a.id} className="card p-5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p className="font-medium text-ink2">
                                                {a.attendance?.date ?? 'Attendance record'} · {classLabel(a)}
                                            </p>
                                            <p className="text-xs text-muted">{formatDate(a.created_at)}</p>
                                        </div>
                                        <StatusBadge status={APPEAL_META[a.status].badge}>
                                            {APPEAL_META[a.status].label}
                                        </StatusBadge>
                                    </div>

                                    <p className="mt-3 text-sm text-ink2">
                                        <span className="text-muted">{a.previous_status}</span>
                                        <span className="mx-2 text-muted">→</span>
                                        <span className="font-medium capitalize">{a.requested_status}</span>
                                    </p>

                                    {a.message && <p className="mt-1 text-sm text-muted">{a.message}</p>}

                                    {a.response_reason && (
                                        <div className="mt-3 rounded-md bg-base p-3">
                                            <p className="text-xs uppercase tracking-wide text-muted">
                                                Response from {a.handler?.name ?? 'the school'}
                                            </p>
                                            <p className="mt-1 text-sm text-ink2">{a.response_reason}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}