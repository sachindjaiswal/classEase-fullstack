import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getClasses } from '@/api/classes';
import { getStudentsByClass, deleteStudent } from '@/api/students';
import type { SchoolClass, Student } from '@/types';
import Button from '@/components/Button';

export default function StudentsByClass() {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        getClasses()
            .then((res) => {
                setClasses(res.data.classes);
                if (res.data.classes.length > 0)
                    setSelectedClassId(res.data.classes[0].id);
            })
            .catch(() => setError("Couldn't load classes."))
            .finally(() => setLoadingClasses(false));
    }, []);

    useEffect(() => {
        if (selectedClassId === null) return;
        setLoadingStudents(true);
        setError(null);
        getStudentsByClass(selectedClassId)
            .then((res) => setStudents(res.data))
            .catch(() => setError("Couldn't load students for this class."))
            .finally(() => setLoadingStudents(false));
    }, [selectedClassId]);

    const handleDelete = async (id: number) => {
        if (!confirm('Remove this student?')) return;
        try {
            await deleteStudent(id);
            if (selectedClassId !== null) {
                getStudentsByClass(selectedClassId)
                    .then((res) => setStudents(res.data))
                    .catch(() => setError("Couldn't load students."));
            }
        } catch {
            alert('Failed to delete student.');
        }
    };

    return (
        <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ink2">Students</h1>
                    <p className="mt-1 text-sm text-muted">Browse students by class</p>
                </div>
                <Link to="/management/students/new">
                    <Button>Add Student</Button>
                </Link>
            </div>

            {loadingClasses && (
                <p className="mt-6 text-sm text-muted">Loading classes…</p>
            )}

            {!loadingClasses && classes.length === 0 && (
                <div className="mt-6 rounded-lg border border-dashed border-border bg-surface p-10 text-center">
                    <p className="text-sm font-medium text-ink2">No classes yet</p>
                    <p className="mt-1 text-sm text-muted">
                        Create a class first — students are always attached to one.
                    </p>
                    <Link to="/management/classes/new" className="mt-3 inline-block">
                        <Button variant="secondary">Add a class</Button>
                    </Link>
                </div>
            )}

            {!loadingClasses && classes.length > 0 && (
                <>
                    <label className="mt-6 flex max-w-xs flex-col gap-1.5 text-sm">
                        <span className="font-medium text-ink2">Class</span>
                        <select
                            value={selectedClassId ?? ''}
                            onChange={(e) =>
                                setSelectedClassId(Number(e.target.value))
                            }
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
                        {loadingStudents && (
                            <p className="p-6 text-sm text-muted">
                                Loading students…
                            </p>
                        )}
                        {error && (
                            <p className="p-6 text-sm text-danger">{error}</p>
                        )}

                        {!loadingStudents && !error && students.length === 0 && (
                            <div className="p-10 text-center">
                                <p className="text-sm font-medium text-ink2">
                                    No students in this class
                                </p>
                                <p className="mt-1 text-sm text-muted">
                                    Add one to get started.
                                </p>
                            </div>
                        )}

                        {!loadingStudents && !error && students.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                     <thead className="bg-base text-xs uppercase tracking-wide text-muted">
                                         <tr>
                                             <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                 Name
                                             </th>
                                             <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                 Email
                                             </th>
                                             <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                 Contact
                                             </th>
                                             <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                 Parent Contact
                                             </th>
                                             <th className="whitespace-nowrap px-5 py-3 font-medium"></th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-border">
                                         {students.map((s) => (
                                             <tr key={s.id} className="hover:bg-base/60">
                                                 <td className="whitespace-nowrap px-5 py-3 font-medium text-ink2">
                                                     {s.firstName} {s.surname}
                                                 </td>
                                                 <td className="whitespace-nowrap px-5 py-3 text-muted">
                                                     {s.email}
                                                 </td>
                                                 <td className="whitespace-nowrap px-5 py-3 data-figure text-muted">
                                                     {s.contact}
                                                 </td>
                                                 <td className="whitespace-nowrap px-5 py-3 data-figure text-muted">
                                                     {s.parentContact}
                                                 </td>
                                                 <td className="whitespace-nowrap px-5 py-3 text-right">
                                                     <button
                                                         onClick={() => navigate(`/management/students/${s.id}/subjects`)}
                                                         className="mr-4 text-sm font-medium text-ink hover:underline"
                                                     >
                                                         Subjects
                                                     </button>
                                                     <button
                                                         onClick={() => navigate(`/management/students/${s.id}/edit`)}
                                                         className="mr-4 text-sm font-medium text-ink hover:underline"
                                                     >
                                                         Edit
                                                     </button>
                                                     <button
                                                         onClick={() => handleDelete(s.id)}
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
                </>
            )}
        </div>
    );
}
