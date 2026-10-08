import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStudent, updateStudent } from '@/api/students';
import { getClasses } from '@/api/classes';
import type { StudentInput, SchoolClass, Student } from '@/types';
import Button from '@/components/Button';
import PasswordInput from '@/components/PasswordInput';

const EMPTY: StudentInput = {
    classId: 0,
    firstName: '',
    middleName: '',
    surname: '',
    email: '',
    password: '',
    contact: '',
    parentContact: '',
    address: '',
};

export default function EditStudent() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const navigate = useNavigate();

    const [form, setForm] = useState<StudentInput>(EMPTY);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getClasses()
            .then((res) => setClasses(res.data.classes))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (isEdit && id) {
            getStudent(Number(id))
                .then((res) => {
                    const s: Student = res.data.student;
                    setForm({
                        classId: 0,
                        firstName: s.firstName,
                        middleName: s.middleName ?? '',
                        surname: s.surname,
                        email: s.email,
                        password: '',
                        contact: s.contact,
                        parentContact: s.parentContact,
                        address: s.address,
                    });
                })
                .catch(() => navigate('/management/students'))
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [isEdit, id, navigate]);

    const update = (key: keyof StudentInput, value: string | number) =>
        setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            await updateStudent(Number(id), form);
            navigate('/management/students');
        } catch (err: any) {
            setErrors(err?.response?.data?.errors ?? {});
        } finally {
            setSaving(false);
        }
    };

    const fieldError = (key: string) => errors[key]?.[0];

    if (loading) {
        return <p className="p-6 text-sm text-muted">Loading student…</p>;
    }

    return (
        <div className="max-w-xl">
            <h1 className="text-2xl font-semibold text-ink2">Edit Student</h1>
            <p className="mt-1 text-sm text-muted">Update student details.</p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field
                        label="First name"
                        value={form.firstName}
                        onChange={(v) => update('firstName', v)}
                        error={fieldError('firstName')}
                    />
                    <Field
                        label="Surname"
                        value={form.surname}
                        onChange={(v) => update('surname', v)}
                        error={fieldError('surname')}
                    />
                </div>

                <Field
                    label="Middle name (optional)"
                    value={form.middleName ?? ''}
                    onChange={(v) => update('middleName', v)}
                    error={fieldError('middleName')}
                />

                <Field
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(v) => update('email', v)}
                    error={fieldError('email')}
                />

                <PasswordInput
                    label="Password"
                    value={form.password}
                    onChange={(v) => update('password', v)}
                    error={fieldError('password')}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field
                        label="Contact"
                        value={form.contact}
                        onChange={(v) => update('contact', v)}
                        error={fieldError('contact')}
                    />
                    <Field
                        label="Parent contact"
                        value={form.parentContact}
                        onChange={(v) => update('parentContact', v)}
                        error={fieldError('parentContact')}
                    />
                </div>

                <Field
                    label="Address"
                    value={form.address}
                    onChange={(v) => update('address', v)}
                    error={fieldError('address')}
                />

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving…' : 'Save Changes'}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/management/students')}
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