import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getClasses } from '@/api/classes';
import { getSubjects } from '@/api/subjects';
import { updateHomework, getHomework } from '@/api/homework';
import type { SchoolClass, Subject, Homework } from '@/types';
import Button from '@/components/Button';

export default function EditHomework() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const existing = (location.state as { homework?: Homework })?.homework;

    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
    const [form, setForm] = useState({
        class_id: '',
        subject_id: '',
        title: '',
        description: '',
        assigned_date: '',
        due_date: '',
    });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(!existing);

    useEffect(() => {
        Promise.all([getClasses(), getSubjects()])
            .then(([classesRes, subjectsRes]) => {
                setClasses(classesRes.data.classes);
                setSubjects(subjectsRes.data.subjects);

                if (existing) {
                    setForm({
                        class_id: String(existing.class_id),
                        subject_id: String(existing.subject_id),
                        title: existing.title,
                        description: existing.description ?? '',
                        assigned_date: existing.assigned_date.split('T')[0],
                        due_date: existing.due_date.split('T')[0],
                    });
                } else if (id) {
                    getHomework(Number(id))
                        .then((res) => {
                            const h = res.data.homework;
                            setForm({
                                class_id: String(h.class_id),
                                subject_id: String(h.subject_id),
                                title: h.title,
                                description: h.description ?? '',
                                assigned_date: h.assigned_date.split('T')[0],
                                due_date: h.due_date.split('T')[0],
                            });
                        })
                        .catch(() => navigate('/management/homework'))
                        .finally(() => setLoading(false));
                }
            })
            .catch(() => {});
    }, [id, existing, navigate]);

    useEffect(() => {
        if (form.class_id) {
            setFilteredSubjects(
                subjects.filter((s) => s.classId === Number(form.class_id))
            );
        } else {
            setFilteredSubjects([]);
        }
    }, [form.class_id, subjects]);

    const update = (key: string, value: string) =>
        setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            await updateHomework(Number(id), {
                class_id: Number(form.class_id),
                subject_id: Number(form.subject_id),
                title: form.title,
                description: form.description || null,
                assigned_date: form.assigned_date,
                due_date: form.due_date,
            });
            navigate('/management/homework');
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
            setErrors(axiosErr?.response?.data?.errors ?? {});
        } finally {
            setSaving(false);
        }
    };

    const fieldError = (key: string) => errors[key]?.[0];

    if (loading) {
        return <p className="p-6 text-sm text-muted">Loading homework...</p>;
    }

    return (
        <div className="max-w-xl">
            <h1 className="text-2xl font-semibold text-ink2">Edit Homework</h1>
            <p className="mt-1 text-sm text-muted">Update homework assignment</p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink2">Class</span>
                    <select
                        value={form.class_id}
                        onChange={(e) => update('class_id', e.target.value)}
                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                    >
                        <option value="">Select a class</option>
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
                    <span className="font-medium text-ink2">Subject</span>
                    <select
                        value={form.subject_id}
                        onChange={(e) => update('subject_id', e.target.value)}
                        disabled={!form.class_id}
                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink disabled:opacity-50"
                    >
                        <option value="">Select a subject</option>
                        {filteredSubjects.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.subjectName}
                            </option>
                        ))}
                    </select>
                    {fieldError('subject_id') && (
                        <span className="text-xs text-danger">{fieldError('subject_id')}</span>
                    )}
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink2">Title</span>
                    <input
                        type="text"
                        value={form.title}
                        onChange={(e) => update('title', e.target.value)}
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
                        rows={3}
                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink resize-none"
                    />
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium text-ink2">Assigned Date</span>
                        <input
                            type="date"
                            value={form.assigned_date}
                            onChange={(e) => update('assigned_date', e.target.value)}
                            className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                        />
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium text-ink2">Due Date</span>
                        <input
                            type="date"
                            value={form.due_date}
                            onChange={(e) => update('due_date', e.target.value)}
                            className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                        />
                        {fieldError('due_date') && (
                            <span className="text-xs text-danger">{fieldError('due_date')}</span>
                        )}
                    </label>
                </div>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/management/homework')}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}
