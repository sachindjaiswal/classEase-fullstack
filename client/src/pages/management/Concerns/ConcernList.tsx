import { Fragment, useEffect, useState } from 'react';
import { getConcerns, updateConcern, deleteConcern } from '@/api/concerns';
import type { Concern, ConcernStatus } from '@/types';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';

const STATUS_META: Record<
    ConcernStatus,
    { badge: 'success' | 'danger' | 'warning' | 'neutral'; label: string }
> = {
    open: { badge: 'warning', label: 'Open' },
    in_progress: { badge: 'neutral', label: 'In Progress' },
    resolved: { badge: 'success', label: 'Resolved' },
};

type FilterValue = 'all' | ConcernStatus;

export default function ConcernList({ canDelete = true }: { canDelete?: boolean }) {
    const [concerns, setConcerns] = useState<Concern[]>([]);
    const [filter, setFilter] = useState<FilterValue>('all');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [draftStatus, setDraftStatus] = useState<ConcernStatus>('open');
    const [replyDraft, setReplyDraft] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError(null);
        getConcerns()
            .then((res) => setConcerns(res.data.concerns))
            .catch(() => setError("Couldn't load concerns."))
            .finally(() => setLoading(false));
    }, []);

    const visible = filter === 'all' ? concerns : concerns.filter((c) => c.status === filter);

    const handleExpand = (concern: Concern) => {
        if (expandedId === concern.id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(concern.id);
        setDraftStatus(concern.status);
        setReplyDraft(concern.admin_reply ?? '');
    };

    const handleSave = async (concern: Concern) => {
        setSaving(true);
        try {
            const res = await updateConcern(concern.id, {
                status: draftStatus,
                admin_reply: replyDraft || null,
            });
            setConcerns((prev) => prev.map((c) => (c.id === concern.id ? res.data.concern : c)));
            setExpandedId(null);
        } catch {
            alert('Failed to update concern.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this concern?')) return;
        try {
            await deleteConcern(id);
            setConcerns((prev) => prev.filter((c) => c.id !== id));
        } catch {
            alert('Failed to delete concern.');
        }
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return `${d.toLocaleDateString()}, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    };

    const studentName = (c: Concern) =>
        c.student ? `${c.student.firstName} ${c.student.surname}` : 'Student';

    return (
        <div>
            <div>
                <h1 className="text-2xl font-semibold text-ink2">Concerns</h1>
                <p className="mt-1 text-sm text-muted">Concerns raised by students</p>
            </div>

            <label className="mt-6 flex max-w-xs flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink2">Status</span>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as FilterValue)}
                    className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                >
                    <option value="all">All concerns</option>
                    {(Object.keys(STATUS_META) as ConcernStatus[]).map((s) => (
                        <option key={s} value={s}>
                            {STATUS_META[s].label}
                        </option>
                    ))}
                </select>
            </label>

            <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
                {loading && <p className="p-6 text-sm text-muted">Loading concerns...</p>}
                {error && <p className="p-6 text-sm text-danger">{error}</p>}

                {!loading && !error && visible.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-ink2">No concerns</p>
                        <p className="mt-1 text-sm text-muted">No student concerns match this filter.</p>
                    </div>
                )}

                {!loading && !error && visible.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-base text-xs uppercase tracking-wide text-muted">
                                <tr>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Student</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Subject</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Status</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Date</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {visible.map((c) => (
                                    <Fragment key={c.id}>
                                        <tr className="hover:bg-base/60">
                                            <td className="whitespace-nowrap px-5 py-3 font-medium text-ink2">
                                                {studentName(c)}
                                            </td>
                                            <td className="px-5 py-3">
                                                <p className="font-medium text-ink2">{c.subject}</p>
                                                {c.description && (
                                                    <p className="mt-0.5 max-w-sm truncate text-xs text-muted">
                                                        {c.description}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3">
                                                <StatusBadge status={STATUS_META[c.status].badge}>
                                                    {STATUS_META[c.status].label}
                                                </StatusBadge>
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3 text-muted">
                                                {formatDate(c.created_at)}
                                            </td>
                                            <td className="whitespace-nowrap px-5 py-3 text-right">
                                                <button
                                                    onClick={() => handleExpand(c)}
                                                    className="mr-4 text-sm font-medium text-ink hover:underline"
                                                >
                                                    {expandedId === c.id ? 'Close' : 'Respond'}
                                                </button>
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDelete(c.id)}
                                                        className="text-sm font-medium text-danger hover:underline"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        {expandedId === c.id && (
                                            <tr>
                                                <td colSpan={5} className="bg-base/50 px-5 py-4">
                                                    {c.admin_reply && (
                                                        <div className="mb-3 rounded-md border border-border bg-surface p-3">
                                                            <p className="text-xs uppercase tracking-wide text-muted">
                                                                Current reply
                                                            </p>
                                                            <p className="mt-1 text-sm text-ink2">{c.admin_reply}</p>
                                                        </div>
                                                    )}
                                                    <div className="flex flex-wrap items-start gap-3">
                                                        <label className="flex flex-col gap-1.5 text-sm">
                                                            <span className="font-medium text-ink2">Status</span>
                                                            <select
                                                                value={draftStatus}
                                                                onChange={(e) =>
                                                                    setDraftStatus(e.target.value as ConcernStatus)
                                                                }
                                                                className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                                                            >
                                                                {(Object.keys(STATUS_META) as ConcernStatus[]).map(
                                                                    (s) => (
                                                                        <option key={s} value={s}>
                                                                            {STATUS_META[s].label}
                                                                        </option>
                                                                    ),
                                                                )}
                                                            </select>
                                                        </label>
                                                        <label className="flex min-w-72 flex-1 flex-col gap-1.5 text-sm">
                                                            <span className="font-medium text-ink2">Reply</span>
                                                            <textarea
                                                                value={replyDraft}
                                                                onChange={(e) => setReplyDraft(e.target.value)}
                                                                rows={2}
                                                                placeholder="Write a response to the student..."
                                                                className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink resize-none"
                                                            />
                                                        </label>
                                                        <div className="flex gap-2 pt-6">
                                                            <Button onClick={() => handleSave(c)} disabled={saving}>
                                                                {saving ? 'Saving...' : 'Save'}
                                                            </Button>
                                                        </div>
                                                    </div>
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