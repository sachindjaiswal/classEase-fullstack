import { Fragment, useEffect, useState } from 'react';
import { getAttendanceAppeals, handleAttendanceAppeal } from '@/api/attendanceAppeals';
import type { AttendanceAppeal, AttendanceAppealStatus } from '@/types';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';

const STATUS_META: Record<
    AttendanceAppealStatus,
    { badge: 'success' | 'danger' | 'warning' | 'neutral'; label: string }
> = {
    pending: { badge: 'warning', label: 'Pending' },
    approved: { badge: 'success', label: 'Approved' },
    rejected: { badge: 'danger', label: 'Rejected' },
};

type FilterValue = 'all' | AttendanceAppealStatus;

export default function AttendanceAppeals() {
    const [appeals, setAppeals] = useState<AttendanceAppeal[]>([]);
    const [filter, setFilter] = useState<FilterValue>('all');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [draftDecision, setDraftDecision] = useState<'approved' | 'rejected'>('approved');
    const [reasonDraft, setReasonDraft] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(null);
        getAttendanceAppeals()
            .then((res) => setAppeals(res.data.corrections))
            .catch(() => setError("Couldn't load attendance appeals."))
            .finally(() => setLoading(false));
    }, []);

    const visible = filter === 'all' ? appeals : appeals.filter((a) => a.status === filter);

    const handleExpand = (appeal: AttendanceAppeal) => {
        if (expandedId === appeal.id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(appeal.id);
        setDraftDecision('approved');
        setReasonDraft('');
    };

    const handleSave = async (appeal: AttendanceAppeal) => {
        setSaving(true);
        try {
            const res = await handleAttendanceAppeal(appeal.id, {
                decision: draftDecision,
                response_reason: reasonDraft || null,
            });
            setAppeals((prev) => prev.map((a) => (a.id === appeal.id ? res.data.correction : a)));
            setExpandedId(null);
        } catch {
            alert('Failed to handle the appeal.');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return `${d.toLocaleDateString()}, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    };

    const studentName = (a: AttendanceAppeal) =>
        a.student ? `${a.student.firstName} ${a.student.surname}` : 'Student';

    const classLabel = (a: AttendanceAppeal) =>
        a.attendance?.class ? `${a.attendance.class.class_name} ${a.attendance.class.section}` : '';

    return (
        <div>
            <div>
                <h1 className="text-2xl font-semibold text-ink2">Attendance Appeals</h1>
                <p className="mt-1 text-sm text-muted">Appeals raised by students against attendance records</p>
            </div>

            <label className="mt-6 flex max-w-xs flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink2">Status</span>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as FilterValue)}
                    className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                >
                    <option value="all">All appeals</option>
                    {(Object.keys(STATUS_META) as AttendanceAppealStatus[]).map((s) => (
                        <option key={s} value={s}>
                            {STATUS_META[s].label}
                        </option>
                    ))}
                </select>
            </label>

            <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
                {loading && <p className="p-6 text-sm text-muted">Loading appeals...</p>}
                {error && <p className="p-6 text-sm text-danger">{error}</p>}

                {!loading && !error && visible.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-ink2">No appeals</p>
                        <p className="mt-1 text-sm text-muted">No attendance appeals match this filter.</p>
                    </div>
                )}

                {!loading && !error && visible.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-base text-xs uppercase tracking-wide text-muted">
                                <tr>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Student</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Date</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Change</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Reason</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Status</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Date raised</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {visible.map((a) => (
                                    <Fragment key={a.id}>
                                        <tr className="hover:bg-base/60">
                                            <td className="whitespace-nowrap px-5 py-3 font-medium text-ink2">
                                                {studentName(a)}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3 text-ink2">
                                                {a.attendance?.date ?? '—'}
                                                {classLabel(a) && (
                                                    <p className="text-xs text-muted">{classLabel(a)}</p>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3">
                                                {a.previous_status}
                                                <span className="mx-1.5 text-muted">→</span>
                                                <span className="font-medium capitalize">{a.requested_status}</span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <p className="max-w-sm truncate text-muted">{a.message ?? '—'}</p>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3">
                                                <StatusBadge status={STATUS_META[a.status].badge}>
                                                    {STATUS_META[a.status].label}
                                                </StatusBadge>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3 text-muted">
                                                {formatDate(a.created_at)}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3 text-right">
                                                {a.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleExpand(a)}
                                                        className="text-sm font-medium text-ink hover:underline"
                                                    >
                                                        {expandedId === a.id ? 'Close' : 'Handle'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        {expandedId === a.id && (
                                            <tr>
                                                <td colSpan={7} className="bg-base/50 px-5 py-4">
                                                    <div className="flex flex-wrap items-start gap-3">
                                                        <label className="flex flex-col gap-1.5 text-sm">
                                                            <span className="font-medium text-ink2">Decision</span>
                                                            <select
                                                                value={draftDecision}
                                                                onChange={(e) =>
                                                                    setDraftDecision(e.target.value as 'approved' | 'rejected')
                                                                }
                                                                className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                                                            >
                                                                <option value="approved">Approve</option>
                                                                <option value="rejected">Reject</option>
                                                            </select>
                                                        </label>
                                                        <label className="flex min-w-72 flex-1 flex-col gap-1.5 text-sm">
                                                            <span className="font-medium text-ink2">
                                                                Reply to student (optional)
                                                            </span>
                                                            <textarea
                                                                value={reasonDraft}
                                                                onChange={(e) => setReasonDraft(e.target.value)}
                                                                rows={2}
                                                                placeholder="Explain your decision to the student..."
                                                                className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink resize-none"
                                                            />
                                                        </label>
                                                        <div className="flex gap-2 pt-6">
                                                            <Button onClick={() => handleSave(a)} disabled={saving}>
                                                                {saving ? 'Saving...' : 'Save'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {a.status !== 'pending' && a.response_reason && (
                                            <tr>
                                                <td colSpan={7} className="bg-base/50 px-5 py-3">
                                                    <p className="text-xs uppercase tracking-wide text-muted">
                                                        Response from {a.handler?.name ?? 'the school'}
                                                    </p>
                                                    <p className="mt-1 text-sm text-ink2">{a.response_reason}</p>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}