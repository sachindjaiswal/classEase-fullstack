import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { addTenantAdmin } from '@/api/platform';
import type { Tenant, TenantAdminInput } from '@/types';
import Button from '@/components/Button';
import PasswordInput from '@/components/PasswordInput';

const EMPTY: TenantAdminInput = {
    name: '',
    email: '',
    password: '',
};

export default function AddAdmin() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const tenant = (location.state as { tenant?: Tenant } | null)?.tenant;

    const [form, setForm] = useState<TenantAdminInput>(EMPTY);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!id) {
            navigate('/platform/institutions');
        }
    }, [id, navigate]);

    const update = (key: keyof TenantAdminInput, value: string) =>
        setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setSaving(true);
        setErrors({});
        try {
            await addTenantAdmin(Number(id), form);
            navigate('/platform/institutions');
        } catch (err: any) {
            setErrors(err?.response?.data?.errors ?? {});
        } finally {
            setSaving(false);
        }
    };

    const fieldError = (key: string) => errors[key]?.[0];

    return (
        <div className="max-w-xl">
            <h1 className="text-2xl font-semibold text-ink2">Add Admin</h1>
            <p className="mt-1 text-sm text-muted">
                {tenant
                    ? `Create another admin account for ${tenant.name}.`
                    : 'Create another admin account for this institution.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <Field
                    label="Admin name"
                    value={form.name}
                    onChange={(v) => update('name', v)}
                    error={fieldError('name')}
                />
                <Field
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(v) => update('email', v)}
                    error={fieldError('email')}
                />
                <Field
                    label="Password"
                    type="password"
                    value={form.password}
                    onChange={(v) => update('password', v)}
                    error={fieldError('password')}
                    helper="At least 6 characters"
                />

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving…' : 'Create Admin'}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/platform/institutions')}
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
    helper,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    type?: 'text' | 'email' | 'password';
    helper?: string;
}) {
    return (
        <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink2">{label}</span>
            {type === 'password' ? (
                <PasswordInput
                    label={label}
                    value={value}
                    onChange={onChange}
                    error={error}
                />
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`input ${
                        error ? 'input-error' : ''
                    }`}
                />
            )}
            {helper && !error && <span className="text-xs text-muted">{helper}</span>}
            {error && <span className="text-xs text-danger">{error}</span>}
        </label>
    );
}