import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTeacher } from '@/api/teachers';
import type { TeacherInput } from '@/types';
import Button from '@/components/Button';
import PasswordInput from '@/components/PasswordInput';

const EMPTY: TeacherInput = {
    first_name: '',
    middle_name: '',
    surname: '',
    email: '',
    password: '',
    contact: '',
    designation: '',
    monthly_salary: 0,
};

export default function AddTeacher() {
    const [form, setForm] = useState<TeacherInput>(EMPTY);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    const update = (key: keyof TeacherInput, value: string | number) =>
        setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            await createTeacher(form);
            navigate('/management/teachers');
        } catch (err: any) {
            setErrors(err?.response?.data?.errors ?? {});
        } finally {
            setSaving(false);
        }
    };

    const fieldError = (key: string) => errors[key]?.[0];

    return (
        <div className="max-w-xl">
            <h1 className="text-2xl font-semibold text-ink2">Add Teacher</h1>
            <p className="mt-1 text-sm text-muted">
                Recruit a new teacher into the system. They sign in with the
                email and password you enter.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field
                        label="First name"
                        value={form.first_name}
                        onChange={(v) => update('first_name', v)}
                        error={fieldError('first_name')}
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
                    value={form.middle_name ?? ''}
                    onChange={(v) => update('middle_name', v)}
                    error={fieldError('middle_name')}
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
                    value={form.password ?? ''}
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
                        label="Designation"
                        value={form.designation}
                        onChange={(v) => update('designation', v)}
                        error={fieldError('designation')}
                    />
                </div>

                <Field
                    label="Monthly salary (₹)"
                    type="number"
                    value={String(form.monthly_salary)}
                    onChange={(v) => update('monthly_salary', Number(v))}
                    error={fieldError('monthly_salary')}
                />

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving…' : 'Add Teacher'}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/management/teachers')}
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
