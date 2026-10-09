import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AuthLayout from '@/layouts/AuthLayout';
import Button from '@/components/Button';

export default function Login() {
    const { user, login, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            navigate(`/${user.role}/dashboard`, { replace: true });
        }
    }, [user, loading, navigate]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
    const [submitting, setSubmitting] = useState(false);

    const validate = () => {
        const next: typeof errors = {};
        if (!email.trim()) {
            next.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            next.email = 'Enter a valid email address';
        }
        if (!password) {
            next.password = 'Password is required';
        } else if (password.length < 6) {
            next.password = 'Password must be at least 6 characters';
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
            await login(email, password);
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.errors?.email?.[0] ||
                'Login failed. Check your credentials.';
            setErrors({ general: msg });
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
            eyebrow={user ? user.role : 'School management'}
            subtitle="Sign in to your account to continue."
            footer={
                <>
                    Don't have an account?{' '}
                    <Link
                        to="/register"
                        className="font-medium text-gold-dark hover:text-ink2 hover:underline"
                    >
                        Sign up
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
                    <span className="label">Password</span>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
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

                <Button type="submit" size="lg" disabled={submitting} className="mt-1 w-full">
                    {submitting ? 'Signing in…' : 'Sign in'}
                </Button>
            </form>

            <div className="mt-6 rounded-2xl border border-border bg-base/70 p-3.5 text-xs text-muted">
                <p className="font-semibold uppercase tracking-wide text-ink2">Demo accounts</p>
                <div className="mt-2 flex flex-col gap-1 font-mono">
                    <p>platform@classease.com</p>
                    <p>admin@classease.com</p>
                    <p className="text-gold-dark">ClassEase@123</p>
                </div>
            </div>
        </AuthLayout>
    );
}
