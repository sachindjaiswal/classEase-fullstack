import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSubject, createSubject, updateSubject } from '@/api/subjects';
import { getClasses } from '@/api/classes';
import { getTeachers } from '@/api/teachers';
import type { SubjectInput, SchoolClass, Teacher } from '@/types';
import Button from '@/components/Button';

const EMPTY: SubjectInput = {
    classId: 0,
    subjectName: '',
    teacherId: 0,
};

export default function SubjectForm() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();

    const [form, setForm] = useState<SubjectInput>(EMPTY);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        Promise.all([
            getClasses().then((res) => setClasses(res.data.classes)),
            getTeachers().then((res) => setTeachers(res.data)).catch(() => {}),
        ]).catch(() => {});
    }, []);

    useEffect(() => {
        if (isEdit && id) {
            getSubject(Number(id))
                .then((res) => setForm(res.data.subject))
                .catch(() => navigate('/management/subjects'))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [isEdit, id, navigate]);

    const update = (key: keyof SubjectInput, value: string | number) =>
        setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (isEdit && id) {
                await updateSubject(Number(id), form);
            } else {
                await createSubject(form);
            }
            navigate('/management/subjects');
        } catch (err: any) {
            setErrors(err?.response?.data?.errors ?? {});
        } finally {
            setSaving(false);
        }
    };

    const fieldError = (key: string) => errors[key]?.[0];

    if (loading) {
        return <p className="p-6 text-sm text-muted">Loading subject…</p>;
    }

    return (
        <div className="max-w-xl">
            <h1 className="text-2xl font-semibold text-ink2">
                {isEdit ? 'Edit Subject' : 'Add Subject'}
            </h1>
            <p className="mt-1 text-sm text-muted">
                {isEdit ? 'Update subject details.' : 'Create a new subject.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <Field
                    label="Subject name"
                    value={form.subjectName}
                    onChange={(v) => update('subjectName', v)}
                    error={fieldError('subjectName')}
                />

                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink2">Class</span>
                    <select
                        value={form.classId || ''}
                        onChange={(e) =>
                            update('classId', Number(e.target.value))
                        }
                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                    >
                        <option value="" disabled>Select a class</option>
                        {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.class_name} — {c.section}
                            </option>
                        ))}
                    </select>
                    {fieldError('classId') && (
                        <span className="text-xs text-danger">
                            {fieldError('classId')}
                        </span>
                    )}
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink2">
                        Teacher (optional)
                    </span>
                    <select
                        value={form.teacherId || ''}
                        onChange={(e) =>
                            update(
                                'teacherId',
                                e.target.value ? Number(e.target.value) : 0,
                            )
                        }
                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                    >
                        <option value="">Unassigned</option>
                        {teachers.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.first_name} {t.surname}
                            </option>
                        ))}
                    </select>
                    {fieldError('teacherId') && (
                        <span className="text-xs text-danger">
                            {fieldError('teacherId')}
                        </span>
                    )}
                </label>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <Button type="submit" disabled={saving}>
                        {saving
                            ? 'Saving…'
                            : isEdit
                              ? 'Save Changes'
                              : 'Add Subject'}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/management/subjects')}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    error,
    type = 'text',
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    type?: string;
}) {
    return (
        <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink2">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`rounded-md border px-3 py-2 text-sm outline-none focus:border-ink ${
                    error ? 'border-danger' : 'border-border'
                }`}
            />
            {error && <span className="text-xs text-danger">{error}</span>}
        </label>
    );
}