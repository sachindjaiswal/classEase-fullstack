import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getStudent } from '@/api/students';
import { createConcern, getConcernsByStudent } from '@/api/concerns';
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

export default function StudentConcerns() {
    const { user } = useAuth();
    const [concerns, setConcerns] = useState<Concern[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({ subject: '', description: '' });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user) return;

        getStudent(user.id)
            .then((res) => {
                const studentId = res.data.student.id;
                return getConcernsByStudent(studentId);
            })
            .then((res) => setConcerns(res.data.concerns))
            .catch(() => setError("Couldn't load your concerns."))
            .finally(() => setLoading(false));
    }, [user]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            const res = await createConcern({
                subject: form.subject,
                description: form.description || null,
            });
            setConcerns((prev) => [res.data.concern, ...prev]);
            setForm({ subject: '', description: '' });
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
            setErrors(axiosErr?.response?.data?.errors ?? {});
        } finally {
            setSaving(false);
        }
    };

    const fieldError = (key: string) => errors[key]?.[0];

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return `${d.toLocaleDateString()}, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    };

    return (
        <div>
            <h1 className="text-2xl font-semibold text-ink2">My Concerns</h1>
            <p className="mt-1 text-sm text-muted">Raise a concern and track its status</p>

            <form onSubmit={handleSubmit} className="mt-6 flex max-w-xl flex-col gap-4 rounded-lg border border-border bg-surface p-5">
                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink2">Subject</span>
                    <input
                        type="text"
                        value={form.subject}
                        onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                        placeholder="e.g. Issue with library books"
                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                    />
                    {fieldError('subject') && (
                        <span className="text-xs text-danger">{fieldError('subject')}</span>
                    )}
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink2">Describe your concern (optional)</span>
                    <textarea
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        rows={3}
                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink resize-none"
                    />
                    {fieldError('description') && (
                        <span className="text-xs text-danger">{fieldError('description')}</span>
                    )}
                </label>

                <div className="flex">
                    <Button type="submit" disabled={saving || !form.subject.trim()}>
                        {saving ? 'Submitting...' : 'Submit Concern'}
                    </Button>
                </div>
            </form>

            <div className="mt-8">
                <h2 className="text-lg font-semibold text-ink2">Your submitted concerns</h2>

                {loading && <p className="mt-4 text-sm text-muted">Loading concerns...</p>}
                {error && <p className="mt-4 text-sm text-danger">{error}</p>}

                {!loading && !error && concerns.length === 0 && (
                    <p className="mt-4 rounded-md border border-border bg-surface p-6 text-sm text-muted">
                        You haven't submitted any concerns yet.
                    </p>
                )}

                {!loading && !error && concerns.length > 0 && (
                    <div className="mt-4 flex flex-col gap-3">
                        {concerns.map((c) => (
                            <div key={c.id} className="rounded-lg border border-border bg-surface p-5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="font-medium text-ink2">{c.subject}</p>
                                        <p className="text-xs text-muted">{formatDate(c.created_at)}</p>
                                    </div>
                                    <StatusBadge status={STATUS_META[c.status].badge}>
                                        {STATUS_META[c.status].label}
                                    </StatusBadge>
                                </div>

                                {c.description && (
                                    <p className="mt-3 text-sm text-muted">{c.description}</p>
                                )}

                                {c.admin_reply && (
                                    <div className="mt-3 rounded-md bg-base p-3">
                                        <p className="text-xs uppercase tracking-wide text-muted">
                                            Response from {c.resolver?.name ?? 'the school'}
                                        </p>
                                        <p className="mt-1 text-sm text-ink2">{c.admin_reply}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}