import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { createTenant, updateTenant } from '@/api/platform';
import type { Tenant, TenantCreateInput, TenantInput } from '@/types';
import Button from '@/components/Button';
import PasswordInput from '@/components/PasswordInput';

const EMPTY: TenantCreateInput = {
    name: '',
    slug: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
};

export default function InstitutionForm() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const location = useLocation();
    const navigate = useNavigate();

    const existing = (location.state as { tenant?: Tenant } | null)?.tenant;

    const [form, setForm] = useState<TenantCreateInput>(() =>
        existing
            ? { ...EMPTY, name: existing.name, slug: existing.slug }
            : EMPTY,
    );
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isEdit && !existing) {
            navigate('/platform/institutions');
        }
    }, [isEdit, existing, navigate]);

    const update = (key: keyof TenantCreateInput, value: string) =>
        setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (isEdit && id) {
                const payload: TenantInput = { name: form.name, slug: form.slug };
                await updateTenant(Number(id), payload);
            } else {
                await createTenant(form);
            }
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
            <h1 className="text-2xl font-semibold text-ink2">
                {isEdit ? 'Edit Institution' : 'New Institution'}
            </h1>
            <p className="mt-1 text-sm text-muted">
                {isEdit
                    ? 'Update the institution name and code.'
                    : 'Create an institution and its first admin account.'}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <Field
                    label="Institution name"
                    value={form.name}
                    onChange={(v) => update('name', v)}
                    error={fieldError('name')}
                />
                <Field
                    label="School code (slug)"
                    value={form.slug}
                    onChange={(v) => update('slug', v)}
                    error={fieldError('slug')}
                    placeholder="lowercase-letters-numbers-hyphens"
                />
                <p className="-mt-2 text-xs text-muted">
                    Students use this code to sign up for the institution. Use
                    lowercase letters, numbers, and hyphens.
                </p>

                {!isEdit && (
                    <>
                        <div className="mt-2 border-t border-border pt-4">
                            <p className="text-sm font-semibold text-ink2">
                                First admin account
                            </p>
                            <p className="mt-1 text-sm text-muted">
                                This account manages the institution once it's created.
                            </p>
                        </div>
                        <Field
                            label="Admin name"
                            value={form.admin_name}
                            onChange={(v) => update('admin_name', v)}
                            error={fieldError('admin_name')}
                        />
                        <Field
                            label="Admin email"
                            type="email"
                            value={form.admin_email}
                            onChange={(v) => update('admin_email', v)}
                            error={fieldError('admin_email')}
                        />
                        <Field
                            label="Password"
                            type="password"
                            value={form.admin_password}
                            onChange={(v) => update('admin_password', v)}
                            error={fieldError('admin_password')}
                            helper="At least 6 characters"
                        />
                    </>
                )}

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <Button type="submit" disabled={saving}>
                        {saving
                            ? 'Saving…'
                            : isEdit
                              ? 'Save Changes'
                              : 'Create Institution'}
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
    placeholder,
    helper,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    type?: 'text' | 'email' | 'password';
    placeholder?: string;
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
                    placeholder={placeholder}
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