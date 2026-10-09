import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTenants, deleteTenant, deleteUser } from '@/api/platform';
import type { Tenant } from '@/types';
import Button from '@/components/Button';

export default function InstitutionList() {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const load = () => {
        setLoading(true);
        setError(null);
        getTenants()
            .then((res) => setTenants(res.data.tenants))
            .catch(() =>
                setError("Couldn't load institutions. Check the backend is running."),
            )
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleDelete = async (id: number, name: string) => {
        if (
            !confirm(
                `Delete institution "${name}"? Its users will lose access to the app ` +
                    `(account data is kept until a hard delete is issued).`,
            )
        )
            return;
        try {
            await deleteTenant(id);
            load();
        } catch {
            alert('Failed to delete institution.');
        }
    };

    const handleEdit = (tenant: Tenant) => {
        navigate(`/platform/institutions/${tenant.id}/edit`, { state: { tenant } });
    };

    const handleAddAdmin = (tenant: Tenant) => {
        navigate(`/platform/institutions/${tenant.id}/admins/new`, {
            state: { tenant },
        });
    };

    const handleDeleteUser = async (user: { id: number; name: string }) => {
        if (!confirm(`Delete the account of "${user.name}"? They will lose access immediately.`))
            return;
        try {
            await deleteUser(user.id);
            load();
        } catch {
            alert('Failed to delete user. It may be the school\u2019s last admin.');
        }
    };

    return (
        <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ink2">Institutions</h1>
                    <p className="mt-1 text-sm text-muted">
                        {tenants.length} institutions on the platform
                    </p>
                </div>
                <Link to="/platform/institutions/new">
                    <Button>New Institution</Button>
                </Link>
            </div>

            <div className="mt-6 overflow-hidden card">
                {loading && <p className="p-6 text-sm text-muted">Loading…</p>}
                {error && <p className="p-6 text-sm text-danger">{error}</p>}

                {!loading && !error && tenants.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-ink2">
                            No institutions yet
                        </p>
                        <p className="mt-1 text-sm text-muted">
                            Create your first institution to get started.
                        </p>
                    </div>
                )}

                {!loading && !error && tenants.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-base text-xs uppercase tracking-wide text-muted">
                                <tr>
                                    <th className="whitespace-nowrap px-5 py-3 pl-0 font-medium">
                                        Institution
                                    </th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">
                                        Users
                                    </th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">
                                        Admin(s)
                                    </th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {tenants.map((t) => (
                                    <tr key={t.id} className="hover:bg-base/60">
                                        <td className="whitespace-nowrap px-5 py-3 pl-0">
                                            <div className="flex items-center gap-3 border-l-2 border-gold pl-3">
                                                <div>
                                                    <p className="font-medium text-ink2">{t.name}</p>
                                                    <p className="font-mono text-xs text-muted">
                                                        {t.slug}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 data-figure text-muted">
                                            {t.users_count ?? 0} <span className="text-muted/50">users</span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3">
                                            {t.admins && t.admins.length > 0 ? (
                                                <div className="flex flex-col gap-1.5">
                                                    {t.admins.map((a) => (
                                                        <span
                                                            key={a.id}
                                                            className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-base/70 py-1 pl-3 pr-1 text-xs text-muted"
                                                        >
                                                            <span className="font-medium text-ink2">
                                                                {a.name}
                                                            </span>
                                                            <span className="text-muted/60">
                                                                {a.email}
                                                            </span>
                                                            <button
                                                                onClick={() =>
                                                                    handleDeleteUser(a)
                                                                }
                                                                title="Delete this admin"
                                                                className="rounded-full bg-danger/10 px-2 py-0.5 font-medium text-danger transition hover:bg-danger hover:text-white"
                                                            >
                                                                Delete
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="italic text-muted/60">None</span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-right">
                                            <button
                                                onClick={() => handleAddAdmin(t)}
                                                className="mr-4 text-sm font-medium text-ink hover:underline"
                                            >
                                                Add admin
                                            </button>
                                            <button
                                                onClick={() => handleEdit(t)}
                                                className="mr-4 text-sm font-medium text-ink hover:underline"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(t.id, t.name)}
                                                className="text-sm font-medium text-danger hover:underline"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}