import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getClasses, deleteClass } from '@/api/classes';
import type { SchoolClass } from '@/types';
import Button from '@/components/Button';

export default function ClassList() {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const load = () => {
        setLoading(true);
        setError(null);
        getClasses()
            .then((res) => setClasses(res.data.classes))
            .catch(() => setError("Couldn't load classes. Check the backend is running."))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Delete class "${name}"? This cannot be undone.`)) return;
        try {
            await deleteClass(id);
            load();
        } catch {
            alert('Failed to delete class.');
        }
    };

    const handleEdit = (cls: SchoolClass) => {
        navigate(`/management/classes/${cls.id}/edit`, { state: { cls } });
    };

    return (
        <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ink2">Classes</h1>
                    <p className="mt-1 text-sm text-muted">
                        {classes.length} classes on record
                    </p>
                </div>
                <Link to="/management/classes/new">
                    <Button>Add Class</Button>
                </Link>
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
                {loading && <p className="p-6 text-sm text-muted">Loading classes…</p>}
                {error && <p className="p-6 text-sm text-danger">{error}</p>}

                {!loading && !error && classes.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-ink2">No classes yet</p>
                        <p className="mt-1 text-sm text-muted">
                            Add your first class to get started.
                        </p>
                    </div>
                )}

                {!loading && !error && classes.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-base text-xs uppercase tracking-wide text-muted">
                                <tr>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">
                                        Class
                                    </th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">
                                        Section
                                    </th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">
                                        Room
                                    </th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">
                                        Class Teacher
                                    </th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {classes.map((c) => (
                                    <tr key={c.id} className="hover:bg-base/60">
                                        <td className="whitespace-nowrap px-5 py-3 font-medium text-ink2">
                                            {c.class_name}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-muted">
                                            {c.section}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 data-figure text-muted">
                                            {c.room_no}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-muted">
                                            {c.class_teacher ? (
                                                c.class_teacher.name
                                            ) : (
                                                <span className="italic text-muted/60">
                                                    Unassigned
                                                </span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-right">
                                            <button
                                                onClick={() => handleEdit(c)}
                                                className="mr-4 text-sm font-medium text-ink hover:underline"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDelete(c.id, c.class_name)
                                                }
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
