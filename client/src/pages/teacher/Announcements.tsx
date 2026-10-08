import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTeacherMe, getTeacherSubjects } from '@/api/teachers';
import {
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
} from '@/api/announcements';
import type { Announcement, ClassSummary, SubjectFull } from '@/types';
import Button from '@/components/Button';

const classesFromSubjects = (subjects: SubjectFull[]): ClassSummary[] => {
    const map = new Map<number, ClassSummary>();
    subjects.forEach((s) => {
        map.set(
            s.classId,
            s.class ?? { id: s.classId, class_name: `Class ${s.classId}` },
        );
    });
    return Array.from(map.values());
};

export default function TeacherAnnouncements() {
    const { user } = useAuth();
    const [subjects, setSubjects] = useState<SubjectFull[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [form, setForm] = useState({ class_id: '', title: '', description: '' });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        getTeacherMe()
            .then((res) => getTeacherSubjects(res.data.id))
            .then((res) => setSubjects(res.data.subjects))
            .catch(() => {});

        getAnnouncements()
            .then((res) => setAnnouncements(res.data.announcements))
            .catch(() => setError("Couldn't load announcements."))
            .finally(() => setLoading(false));
    }, [user]);

    const update = (key: string, value: string) =>
        setForm((f) => ({ ...f, [key]: value }));

    const fieldError = (key: string) => errors[key]?.[0];

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return `${d.toLocaleDateString()}, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        const payload = {
            class_id: form.class_id ? Number(form.class_id) : null,
            title: form.title,
            description: form.description || null,
        };
        try {
            if (editingId) {
                await updateAnnouncement(editingId, payload);
            } else {
                await createAnnouncement(payload);
            }
            setForm({ class_id: '', title: '', description: '' });
            setEditingId(null);
            const res = await getAnnouncements();
            setAnnouncements(res.data.announcements);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
            setErrors(axiosErr?.response?.data?.errors ?? {});
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (a: Announcement) => {
        setEditingId(a.id);
        setForm({
            class_id: a.class_id === null ? '' : String(a.class_id),
            title: a.title,
            description: a.description ?? '',
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({ class_id: '', title: '', description: '' });
        setErrors({});
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this announcement?')) return;
        try {
            await deleteAnnouncement(id);
            setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        } catch {
            alert('Failed to delete announcement.');
        }
    };

    const classes = classesFromSubjects(subjects);

    return (
        <div>
            <div>
                <h1 className="text-2xl font-semibold text-ink2">Announcements</h1>
                <p className="mt-1 text-sm text-muted">
                    Post notices to your classes or everyone
                </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-4 rounded-lg border border-border bg-surface p-5">
                <p className="text-sm font-medium text-ink2">
                    {editingId ? 'Edit announcement' : 'Post an announcement'}
                </p>
                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink2">Audience</span>
                    <select
                        value={form.class_id}
                        onChange={(e) => update('class_id', e.target.value)}
                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                    >
                        <option value="">All classes (general announcement)</option>
                        {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.class_name}
                            </option>
                        ))}
                    </select>
                    {fieldError('class_id') && (
                        <span className="text-xs text-danger">{fieldError('class_id')}</span>
                    )}
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink2">Title</span>
                    <input
                        type="text"
                        value={form.title}
                        onChange={(e) => update('title', e.target.value)}
                        placeholder="e.g. Unit test on Friday"
                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                    />
                    {fieldError('title') && (
                        <span className="text-xs text-danger">{fieldError('title')}</span>
                    )}
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink2">Description (optional)</span>
                    <textarea
                        value={form.description}
                        onChange={(e) => update('description', e.target.value)}
                        rows={4}
                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink resize-none"
                    />
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Post Announcement'}
                    </Button>
                    {editingId && (
                        <Button type="button" variant="secondary" onClick={cancelEdit}>
                            Cancel
                        </Button>
                    )}
                </div>
            </form>

            {classes.length === 0 && (
                <p className="mt-4 rounded-md bg-base px-3 py-2 text-xs text-muted">
                    You have no classes with subjects assigned yet.
                </p>
            )}

            <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
                {loading && <p className="p-6 text-sm text-muted">Loading announcements...</p>}
                {error && <p className="p-6 text-sm text-danger">{error}</p>}

                {!loading && !error && announcements.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-ink2">No announcements</p>
                        <p className="mt-1 text-sm text-muted">
                            Post an announcement to get started.
                        </p>
                    </div>
                )}

                {!loading && !error && announcements.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-base text-xs uppercase tracking-wide text-muted">
                                <tr>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Title</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Audience</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Posted by</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Date</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {announcements.map((a) => (
                                    <tr key={a.id} className="hover:bg-base/60">
                                        <td className="whitespace-nowrap px-5 py-3">
                                            <p className="font-medium text-ink2">{a.title}</p>
                                            {a.description && (
                                                <p className="mt-0.5 max-w-sm truncate text-xs text-muted">
                                                    {a.description}
                                                </p>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-muted">
                                            {a.class ? a.class.class_name : 'All classes'}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-muted">
                                            {a.poster?.name ?? '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-muted">
                                            {formatDate(a.created_at)}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-right">
                                            <button
                                                onClick={() => startEdit(a)}
                                                className="mr-4 text-sm font-medium text-ink hover:underline"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(a.id)}
                                                className="text-sm font-medium text-danger hover:underline"
                                            >
                                                Delete
                                            </button>
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