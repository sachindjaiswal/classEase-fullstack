import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTeachers, deleteTeacher, getTeacher } from '@/api/teachers';
import type { Teacher } from '@/types';
import Button from '@/components/Button';

export default function TeacherList() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const load = () => {
        setLoading(true);
        getTeachers()
            .then((res) => setTeachers(res.data))
            .catch(() => setError("Couldn't load teachers. Check the backend is running."))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Remove this teacher?')) return;
        try {
            await deleteTeacher(id);
            load();
        } catch {
            alert('Failed to delete teacher.');
        }
    };

    return (
        <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ink2">Teachers</h1>
                    <p className="mt-1 text-sm text-muted">
                        {teachers.length} teachers on record
                    </p>
                </div>
                <Link to="/management/teachers/new">
                    <Button>Add Teacher</Button>
                </Link>
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
                {loading && <p className="p-6 text-sm text-muted">Loading teachers…</p>}
                {error && <p className="p-6 text-sm text-danger">{error}</p>}

                {!loading && !error && teachers.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-ink2">No teachers yet</p>
                        <p className="mt-1 text-sm text-muted">
                            Add your first teacher to get started.
                        </p>
                    </div>
                )}

                {!loading && !error && teachers.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-base text-xs uppercase tracking-wide text-muted">
                                <tr>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">
                                        No.
                                    </th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">
                                        Name
                                    </th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">
                                        Designation
                                    </th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">
                                        Contact
                                    </th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">
                                        Salary
                                    </th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {teachers.map((t, idx) => (
                                    <tr key={t.id} className="hover:bg-base/60">
                                        <td className="whitespace-nowrap px-5 py-3 text-muted data-figure">
                                            {idx + 1}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 font-medium text-ink2">
                                            {t.first_name} {t.surname}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-muted">
                                            {t.designation}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-muted data-figure">
                                            {t.contact}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 data-figure">
                                            ₹{Number(t.monthly_salary).toLocaleString('en-IN')}
                                        </td>
                                         <td className="whitespace-nowrap px-5 py-3 text-right">
                                             <button
                                                 onClick={() => navigate(`/management/teachers/${t.id}/subjects`)}
                                                 className="mr-4 text-sm font-medium text-ink hover:underline"
                                             >
                                                 Subjects
                                             </button>
                                             <button
                                                 onClick={() => navigate(`/management/teachers/${t.id}/edit`)}
                                                 className="mr-4 text-sm font-medium text-ink hover:underline"
                                             >
                                                 Edit
                                             </button>
                                             <button
                                                 onClick={() => handleDelete(t.id)}
                                                 className="text-sm font-medium text-danger hover:underline"
                                             >
                                                 Remove
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
