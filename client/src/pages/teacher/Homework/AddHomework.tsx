import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeacherMe, getTeacherSubjects } from '@/api/teachers';
import { createHomework } from '@/api/homework';
import type { Subject, SubjectFull } from '@/types';
import Button from '@/components/Button';

export default function TeacherAddHomework() {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState<SubjectFull[]>([]);
    const [form, setForm] = useState({
        subject_id: '',
        title: '',
        description: '',
        assigned_date: new Date().toISOString().split('T')[0],
        due_date: '',
    });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getTeacherMe()
            .then((res) => getTeacherSubjects(res.data.id))
            .then((subjectsRes) => setSubjects(subjectsRes.data.subjects ?? []))
            .catch(() => {});
    }, []);

    const selectedSubject = subjects.find(
        (s) => s.id === Number(form.subject_id)
    ) as SubjectFull | undefined;

    const update = (key: string, value: string) =>
        setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedSubject || !selectedSubject.class) return;
        setSaving(true);
        setErrors({});
        try {
            await createHomework({
                class_id: selectedSubject.class.id,
                subject_id: Number(form.subject_id),
                title: form.title,
                description: form.description || null,
                assigned_date: form.assigned_date,
                due_date: form.due_date,
            });
            navigate('/teacher/homework');
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
            <h1 className="text-2xl font-semibold text-ink2">Add Homework</h1>
            <p className="mt-1 text-sm text-muted">Assign homework to your subject</p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink2">Subject</span>
                    <select
                        value={form.subject_id}
                        onChange={(e) => update('subject_id', e.target.value)}
                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                    >
                        <option value="">Select your subject</option>
                        {subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.subjectName}
                                {s.class?.class_name ? ` (${s.class.class_name})` : ''}
                            </option>
                        ))}
                    </select>
                    {fieldError('subject_id') && (
                        <span className="text-xs text-danger">{fieldError('subject_id')}</span>
                    )}
                </label>

                {selectedSubject?.class?.class_name && (
                    <p className="text-xs text-muted">
                        Class: <span className="font-medium text-ink2">{selectedSubject.class.class_name}</span>
                    </p>
                )}

                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink2">Title</span>
                    <input
                        type="text"
                        value={form.title}
                        onChange={(e) => update('title', e.target.value)}
                        placeholder="e.g. Chapter 5 exercises"
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
                    <Button type="submit" disabled={saving || !selectedSubject}>
                        {saving ? 'Saving...' : 'Assign Homework'}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/teacher/homework')}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}