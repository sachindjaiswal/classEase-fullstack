import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getClasses } from '@/api/classes';
import { getHomeworkByClass, deleteHomework } from '@/api/homework';
import type { SchoolClass, Homework } from '@/types';
import Button from '@/components/Button';

export default function HomeworkList() {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [homeworks, setHomeworks] = useState<Homework[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        getClasses()
            .then((res) => {
                setClasses(res.data.classes);
                if (res.data.classes.length > 0)
                    setSelectedClassId(res.data.classes[0].id);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (selectedClassId === null) return;
        setLoading(true);
        setError(null);
        getHomeworkByClass(selectedClassId)
            .then((res) => setHomeworks(res.data.homeworks))
            .catch(() => setError("Couldn't load homework."))
            .finally(() => setLoading(false));
    }, [selectedClassId]);

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this homework?')) return;
        try {
            await deleteHomework(id);
            setHomeworks((prev) => prev.filter((h) => h.id !== id));
        } catch {
            alert('Failed to delete homework.');
        }
    };

    const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

    return (
        <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ink2">Homework</h1>
                    <p className="mt-1 text-sm text-muted">
                        Manage homework assignments
                    </p>
                </div>
                <Link to="/management/homework/new">
                    <Button>Add Homework</Button>
                </Link>
            </div>

            <label className="mt-6 flex max-w-xs flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink2">Class</span>
                <select
                    value={selectedClassId ?? ''}
                    onChange={(e) => setSelectedClassId(Number(e.target.value))}
                    className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                >
                    {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.class_name} — {c.section}
                        </option>
                    ))}
                </select>
            </label>

            <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
                {loading && <p className="p-6 text-sm text-muted">Loading homework...</p>}
                {error && <p className="p-6 text-sm text-danger">{error}</p>}

                {!loading && !error && homeworks.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-ink2">No homework assigned</p>
                        <p className="mt-1 text-sm text-muted">
                            Assign homework to get started.
                        </p>
                    </div>
                )}

                {!loading && !error && homeworks.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-base text-xs uppercase tracking-wide text-muted">
                                <tr>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Title</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Subject</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Assigned</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Due</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {homeworks.map((h) => (
                                    <tr key={h.id} className="hover:bg-base/60">
                                        <td className="whitespace-nowrap px-5 py-3 font-medium text-ink2">
                                            {h.title}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-muted">
                                            {h.subject?.subjectName ?? '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-muted">
                                            {new Date(h.assigned_date).toLocaleDateString()}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3">
                                            <span className={isOverdue(h.due_date) ? 'text-danger font-medium' : 'text-muted'}>
                                                {new Date(h.due_date).toLocaleDateString()}
                                                {isOverdue(h.due_date) && ' (Overdue)'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-right">
                                            <button
                                                onClick={() => navigate(`/management/homework/${h.id}/edit`, { state: { homework: h } })}
                                                className="mr-4 text-sm font-medium text-ink hover:underline"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(h.id)}
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
