import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTeacherMe, getTeacherSubjects } from '@/api/teachers';
import { getHomeworkByClass, deleteHomework } from '@/api/homework';
import type { Homework } from '@/types';
import Button from '@/components/Button';

interface TeacherClass {
    id: number;
    class_name: string;
    section?: string | null;
}

export default function TeacherHomeworkList() {
    const [classes, setClasses] = useState<TeacherClass[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [teacherId, setTeacherId] = useState<number | null>(null);
    const [homeworks, setHomeworks] = useState<Homework[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        getTeacherMe()
            .then((res) => {
                setTeacherId(res.data.id);
                return getTeacherSubjects(res.data.id);
            })
            .then((subjectsRes) => {
                const classMap = new Map<number, TeacherClass>();
                (subjectsRes.data.subjects ?? []).forEach((s) => {
                    if (s.class) {
                        const c = s.class as unknown as TeacherClass;
                        classMap.set(c.id, { id: c.id, class_name: c.class_name, section: c.section });
                    }
                });
                const list = Array.from(classMap.values());
                setClasses(list);
                if (list.length > 0) setSelectedClassId(list[0].id);
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
    const canManage = (h: Homework) => h.assigned_by === teacherId;

    return (
        <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ink2">Homework</h1>
                    <p className="mt-1 text-sm text-muted">
                        Assign and manage homework for your subjects
                    </p>
                </div>
                <Link to="/teacher/homework/new">
                    <Button>Add Homework</Button>
                </Link>
            </div>

            <label className="mt-6 flex max-w-xs flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink2">Class</span>
                <select
                    value={selectedClassId ?? ''}
                    onChange={(e) => setSelectedClassId(Number(e.target.value))}
                    className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                    disabled={classes.length === 0}
                >
                    {classes.length === 0 && <option value="">No classes assigned</option>}
                    {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.class_name}
                            {c.section ? ` — ${c.section}` : ''}
                        </option>
                    ))}
                </select>
            </label>

            <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
                {loading && <p className="p-6 text-sm text-muted">Loading homework...</p>}
                {error && <p className="p-6 text-sm text-danger">{error}</p>}

                {!loading && !error && classes.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-ink2">No subjects assigned to you</p>
                        <p className="mt-1 text-xs text-muted">
                            You'll be able to assign homework once you're assigned to a subject.
                        </p>
                    </div>
                )}

                {!loading && !error && classes.length > 0 && homeworks.length === 0 && (
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
                                            <span className={isOverdue(h.due_date) ? 'font-medium text-danger' : 'text-muted'}>
                                                {new Date(h.due_date).toLocaleDateString()}
                                                {isOverdue(h.due_date) && ' (Overdue)'}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-right">
                                            {canManage(h) ? (
                                                <>
                                                    <button
                                                        onClick={() => navigate(`/teacher/homework/${h.id}/edit`, { state: { homework: h } })}
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
                                                </>
                                            ) : (
                                                <span className="text-xs text-muted">
                                                    {h.teacher ? `by ${h.teacher.first_name} ${h.teacher.surname}` : 'by admin'}
                                                </span>
                                            )}
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