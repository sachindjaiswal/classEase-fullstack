import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClasses } from '@/api/classes';
import { createAnnouncement } from '@/api/announcements';
import type { SchoolClass } from '@/types';
import Button from '@/components/Button';

export default function AddAnnouncement() {
    const navigate = useNavigate();
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [form, setForm] = useState({
        class_id: '',
        title: '',
        description: '',
    });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getClasses()
            .then((res) => setClasses(res.data.classes))
            .catch(() => {});
    }, []);

    const update = (key: string, value: string) =>
        setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            await createAnnouncement({
                class_id: form.class_id ? Number(form.class_id) : null,
                title: form.title,
                description: form.description || null,
            });
            navigate('/management/announcements');
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
            setErrors(axiosErr?.response?.data?.errors ?? {});
        } finally {
            setSaving(false);
        }
    };

    const fieldError = (key: string) => errors[key]?.[0];

    return (
        <div className="max-w-xl">
            <h1 className="text-2xl font-semibold text-ink2">Add Announcement</h1>
            <p className="mt-1 text-sm text-muted">Post an announcement to a class or everyone</p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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
                                {c.class_name} — {c.section}
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
                        placeholder="e.g. Parent-teacher meeting"
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

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Post Announcement'}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/management/announcements')}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}