import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTenants } from '@/api/platform';
import type { Tenant } from '@/types';
import Button from '@/components/Button';

interface Stats {
    institutions: number;
    users: number;
    admins: number;
}

function computeStats(tenants: Tenant[]): Stats {
    return {
        institutions: tenants.length,
        users: tenants.reduce((sum, t) => sum + (t.users_count ?? 0), 0),
        admins: tenants.reduce((sum, t) => sum + (t.admins_count ?? 0), 0),
    };
}

export default function PlatformDashboard() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getTenants()
            .then((res) => setTenants(res.data.tenants))
            .catch(() =>
                setError("Couldn't load institutions. Check the backend is running."),
            )
            .finally(() => setLoading(false));
    }, []);

    const stats = computeStats(tenants);

    const statCards = [
        {
            label: 'Institutions',
            value: stats.institutions,
            accent: 'text-gold',
            bg: 'bg-gold/10',
            icon: (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
            ),
        },
        {
            label: 'Total users',
            value: stats.users,
            accent: 'text-teal',
            bg: 'bg-teal/10',
            icon: (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
            ),
        },
        {
            label: 'Institution admins',
            value: stats.admins,
            accent: 'text-ink-light',
            bg: 'bg-ink/10',
            icon: (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3 3 0 01-1 2.28V11a1 1 0 01-1 1h-2a1 1 0 01-1-1v-.72A3 3 0 017 8a3 3 0 013-3zm-3 9v-1h6v1a1 1 0 01-1 1H7a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
            ),
        },
    ];

    return (
        <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ink2">Platform Overview</h1>
                    <p className="mt-1 text-sm text-muted">
                        Manage institutions and their admin accounts.
                    </p>
                </div>
                <Link to="/platform/institutions/new">
                    <Button>New Institution</Button>
                </Link>
            </div>

            {loading && <p className="mt-6 text-sm text-muted">Loading…</p>}
            {error && <p className="mt-6 text-sm text-danger">{error}</p>}

            {!loading && !error && (
                <>
                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {statCards.map((card) => (
                            <div
                                key={card.label}
                                className="flex items-start justify-between rounded-xl border border-border border-t-4 bg-surface p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div>
                                    <p className="text-sm text-muted">{card.label}</p>
                                    <p className="mt-1 font-display text-3xl font-semibold text-ink2">
                                        {card.value}
                                    </p>
                                </div>
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg} ${card.accent}`}
                                >
                                    {card.icon}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-ink2">
                                Institutions
                            </h2>
                            <Link
                                to="/platform/institutions"
                                className="text-sm font-medium text-ink hover:underline"
                            >
                                Manage all
                            </Link>
                        </div>

                        <div className="mt-3 overflow-hidden card">
                            {tenants.length === 0 && (
                                <div className="p-10 text-center">
                                    <p className="text-sm font-medium text-ink2">
                                        No institutions yet
                                    </p>
                                    <p className="mt-1 text-sm text-muted">
                                        Create your first institution to get started.
                                    </p>
                                </div>
                            )}
                            {tenants.length > 0 && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-base text-xs uppercase tracking-wide text-muted">
                                            <tr>
                                                <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                    Name
                                                </th>
                                                <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                    Code
                                                </th>
                                                <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                    Users
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {tenants.slice(0, 5).map((t) => (
                                                <tr key={t.id} className="hover:bg-base/60">
                                                    <td className="whitespace-nowrap px-5 py-3 font-medium text-ink2">
                                                        {t.name}
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-3 data-figure font-mono text-muted">
                                                        {t.slug}
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-3 data-figure text-muted">
                                                        {t.users_count ?? 0}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}