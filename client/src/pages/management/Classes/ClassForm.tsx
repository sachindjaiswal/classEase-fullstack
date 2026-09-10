import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createClass, updateClass } from '@/api/classes';
import { getTeachers } from '@/api/teachers';
import type { ClassInput, SchoolClass, Teacher } from '@/types';
import Button from '@/components/Button';

const EMPTY: ClassInput = {
    class_teacher: null,
    class_name: '',
    section: '',
    room_no: '',
};

export default function ClassForm() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const location = useLocation();
    const navigate = useNavigate();

    const existing = (location.state as { cls?: SchoolClass } | null)?.cls;

    const [form, setForm] = useState<ClassInput>(
        existing
            ? {
                  class_teacher: existing.class_teacher?.id ?? null,
                  class_name: existing.class_name,
                  section: existing.section,
                  room_no: existing.room_no,
              }
            : EMPTY,
    );
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getTeachers()
            .then((res) => setTeachers(res.data))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (isEdit && !existing) {
            navigate('/management/classes');
        }
    }, [isEdit, existing, navigate]);

    const update = (key: keyof ClassInput, value: string | number | null) =>
        setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (isEdit && id) {
                await updateClass(Number(id), form);
            } else {
                await createClass(form);
            }
            navigate('/management/classes');
        } catch (err: any) {
            setErrors(err?.response?.data?.errors ?? {});
        } finally {
            setSaving(false);
        }
    };

    const fieldError = (key: string) => errors[key]?.[0];

    return (
        <div className="max-w-xl">
            <h1 className="text-2xl font-semibold text-ink2">
                {isEdit ? 'Edit Class' : 'Add Class'}
            </h1>
            <p className="mt-1 text-sm text-muted">
                {isEdit ? 'Update class details.' : 'Create a new class.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field
                        label="Class name"
                        value={form.class_name}
                        onChange={(v) => update('class_name', v)}
                        error={fieldError('class_name')}
                    />
                    <Field
                        label="Section"
                        value={form.section}
                        onChange={(v) => update('section', v)}
                        error={fieldError('section')}
                    />
                </div>

                <Field
                    label="Room number"
                    value={form.room_no}
                    onChange={(v) => update('room_no', v)}
                    error={fieldError('room_no')}
                />

                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink2">
                        Class teacher (optional)
                    </span>
                    <select
                        value={form.class_teacher ?? ''}
                        onChange={(e) =>
                            update(
                                'class_teacher',
                                e.target.value ? Number(e.target.value) : null,
                            )
                        }
                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                    >
                        <option value="">Unassigned</option>
                        {teachers.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.first_name} {t.surname} — {t.designation}
                            </option>
                        ))}
                    </select>
                    {fieldError('class_teacher') && (
                        <span className="text-xs text-danger">
                            {fieldError('class_teacher')}
                        </span>
                    )}
                </label>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <Button type="submit" disabled={saving}>
                        {saving
                            ? 'Saving…'
                            : isEdit
                              ? 'Save Changes'
                              : 'Add Class'}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/management/classes')}
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
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
}) {
    return (
        <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink2">{label}</span>
            <input
                type="text"
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
