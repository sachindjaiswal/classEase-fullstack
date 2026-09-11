import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSubjects, deleteSubject } from '@/api/subjects';
import type { SubjectFull } from '@/types';
import Button from '@/components/Button';

export default function SubjectList() {
    const [subjects, setSubjects] = useState<SubjectFull[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const load = () => {
        setLoading(true);
        getSubjects()
            .then((res) => setSubjects(res.data.subjects))
            .catch(() => setError("Couldn't load subjects. Check the backend is running."))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Delete subject "${name}"? This cannot be undone.`)) return;
        try {
            await deleteSubject(id);
            load();
        } catch {
            alert('Failed to delete subject.');
        }
    };

    return (
        <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ink2">Subjects</h1>
                    <p className="mt-1 text-sm text-muted">
                        {subjects.length} subjects on record
                    </p>
                </div>
                <Link to="/management/subjects/new">
                    <Button>Add Subject</Button>
                </Link>
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
                {loading && <p className="p-6 text-sm text-muted">Loading subjects…</p>}
                {error && <p className="p-6 text-sm text-danger">{error}</p>}

                {!loading && !error && subjects.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-ink2">No subjects yet</p>
                        <p className="mt-1 text-sm text-muted">
                            Add your first subject to get started.
                        </p>
                    </div>
                )}

                {!loading && !error && subjects.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-base text-xs uppercase tracking-wide text-muted">
                                <tr>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">
                                        Subject
                                    </th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">
                                        Class
                                    </th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">
                                        Teacher
                                    </th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {subjects.map((s) => (
                                    <tr key={s.id} className="hover:bg-base/60">
                                        <td className="whitespace-nowrap px-5 py-3 font-medium text-ink2">
                                            {s.subjectName}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-muted">
                                            {s.class ? s.class.class_name : '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-muted">
                                            {s.teacher ? (
                                                `${s.teacher.first_name} ${s.teacher.surname}`
                                            ) : (
                                                <span className="italic text-muted/60">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-right">
                                            <button
                                                onClick={() => navigate(`/management/subjects/${s.id}/edit`)}
                                                className="mr-4 text-sm font-medium text-ink hover:underline"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(s.id, s.subjectName)}
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