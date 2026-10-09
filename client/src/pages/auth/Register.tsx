import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getTenantOptions } from '@/api/tenants';
import type { TenantOption } from '@/types';
import AuthLayout from '@/layouts/AuthLayout';
import Button from '@/components/Button';

export default function Register() {
    const { user, register, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            navigate(`/${user.role}/dashboard`, { replace: true });
        }
    }, [user, loading, navigate]);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [tenantSlug, setTenantSlug] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [institutions, setInstitutions] = useState<TenantOption[]>([]);
    const [optionsError, setOptionsError] = useState<string | null>(null);
    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        tenant_slug?: string;
        password?: string;
        password_confirmation?: string;
        general?: string;
    }>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        getTenantOptions()
            .then((res) => setInstitutions(res.data.tenants))
            .catch(() => setOptionsError("Couldn't load institutions."))
            .finally(() => {});
    }, []);

    const validate = () => {
        const next: typeof errors = {};
        if (!name.trim()) {
            next.name = 'Name is required';
        }
        if (!email.trim()) {
            next.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            next.email = 'Enter a valid email address';
        }
        if (!tenantSlug) {
            next.tenant_slug = 'Select your school';
        }
        if (!password) {
            next.password = 'Password is required';
        } else if (password.length < 6) {
            next.password = 'Password must be at least 6 characters';
        }
        if (!passwordConfirmation) {
            next.password_confirmation = 'Please confirm your password';
        } else if (password !== passwordConfirmation) {
            next.password_confirmation = 'Passwords do not match';
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        setErrors({});
        try {
            await register(name, email, password, passwordConfirmation, tenantSlug.trim());
        } catch (err: any) {
            const serverErrors = err?.response?.data?.errors;
            if (serverErrors) {
                setErrors({
                    name: serverErrors.name?.[0],
                    email: serverErrors.email?.[0],
                    tenant_slug: serverErrors.tenant_slug?.[0],
                    password: serverErrors.password?.[0],
                    password_confirmation: serverErrors.password_confirmation?.[0],
                });
            } else {
                const msg =
                    err?.response?.data?.message ||
                    'Registration failed. Please try again.';
                setErrors({ general: msg });
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-ink">
                <p className="text-sm text-white/60">Loading…</p>
            </div>
        );
    }

    return (
        <AuthLayout
            eyebrow="Student sign-up"
            subtitle="Create your student account to get started."
            footer={
                <>
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="font-medium text-gold-dark hover:text-ink2 hover:underline"
                    >
                        Sign in
                    </Link>
                </>
            }
        >
            {errors.general && (
                <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
                    {errors.general}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                <label className="flex flex-col text-sm">
                    <span className="label">Full name</span>
                    <input
                        type="text"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className={`input ${errors.name ? 'input-error' : ''}`}
                    />
                    {errors.name && (
                        <span className="mt-1 text-xs text-danger">{errors.name}</span>
                    )}
                </label>

                <label className="flex flex-col text-sm">
                    <span className="label">Email</span>
                    <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@classease.edu"
                        className={`input ${errors.email ? 'input-error' : ''}`}
                    />
                    {errors.email && (
                        <span className="mt-1 text-xs text-danger">{errors.email}</span>
                    )}
                </label>

                <label className="flex flex-col text-sm">
                    <span className="label">Institution</span>
                    {optionsError ? (
                        <span className="text-xs text-danger">{optionsError}</span>
                    ) : (
                        <select
                            value={tenantSlug}
                            onChange={(e) => setTenantSlug(e.target.value)}
                            className={`input ${errors.tenant_slug ? 'input-error' : ''}`}
                        >
                            <option value="">Select your school…</option>
                            {institutions.map((inst) => (
                                <option key={inst.id} value={inst.slug}>
                                    {inst.name}
                                </option>
                            ))}
                        </select>
                    )}
                    {errors.tenant_slug && (
                        <span className="mt-1 text-xs text-danger">{errors.tenant_slug}</span>
                    )}
                </label>

                <label className="flex flex-col text-sm">
                    <span className="label">Password</span>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className={`input pr-16 ${errors.password ? 'input-error' : ''}`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            className="absolute inset-y-0 right-0 flex items-center px-3.5 text-xs font-semibold text-gold-dark transition hover:text-ink2"
                        >
                            {showPassword ? 'Hide' : 'Show'}
                        </button>
                    </div>
                    {errors.password && (
                        <span className="mt-1 text-xs text-danger">{errors.password}</span>
                    )}
                </label>

                <label className="flex flex-col text-sm">
                    <span className="label">Confirm password</span>
                    <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        placeholder="••••••••"
                        className={`input ${errors.password_confirmation ? 'input-error' : ''}`}
                    />
                    {errors.password_confirmation && (
                        <span className="mt-1 text-xs text-danger">
                            {errors.password_confirmation}
                        </span>
                    )}
                </label>

                <Button type="submit" size="lg" disabled={submitting} className="mt-1 w-full">
                    {submitting ? 'Creating account…' : 'Create account'}
                </Button>
            </form>
        </AuthLayout>
    );
}
