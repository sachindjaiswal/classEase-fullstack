import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

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
        <div className="flex min-h-screen w-full items-center justify-center bg-ink px-4">
            <div className="w-full max-w-sm rounded-xl bg-surface p-6 shadow-xl sm:p-8">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink font-display text-sm font-semibold text-gold">
                        CE
                    </div>
                    <h1 className="font-display text-xl font-semibold text-ink2">ClassEase</h1>
                </div>
                <p className="mt-3 text-sm text-muted">Sign in to your account.</p>

                {errors.general && (
                    <div className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
                    <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium text-ink2">Email</span>
                        <input
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@classease.edu"
                            className={`rounded-md border px-3 py-2 text-sm outline-none focus:border-ink ${
                                errors.email ? 'border-danger' : 'border-border'
                            }`}
                        />
                        {errors.email && (
                            <span className="text-xs text-danger">{errors.email}</span>
                        )}
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium text-ink2">Password</span>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className={`w-full rounded-md border px-3 py-2 pr-16 text-sm outline-none focus:border-ink ${
                                    errors.password ? 'border-danger' : 'border-border'
                                }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted hover:text-ink2"
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {errors.password && (
                            <span className="text-xs text-danger">{errors.password}</span>
                        )}
                    </label>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="mt-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ink-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-muted">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium text-ink2 hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
