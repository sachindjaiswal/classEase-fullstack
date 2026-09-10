import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStudent, getStudentSubjects } from '@/api/students';
import type { Student, SubjectFull } from '@/types';
import Button from '@/components/Button';

export default function StudentSubjects() {
    const { id } = useParams();
    const navigate = useNavigate();
    const studentId = Number(id);

    const [student, setStudent] = useState<Student | null>(null);
    const [subjects, setSubjects] = useState<SubjectFull[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!studentId) return;
        setLoading(true);
        setError(null);
        getStudent(studentId)
            .then((res) => {
                setStudent(res.data.student);
                return getStudentSubjects(studentId);
            })
            .then((res) => setSubjects(res.data.subjects))
            .catch(() => setError("Couldn't load the student's subjects."))
            .finally(() => setLoading(false));
    }, [studentId]);

    return (
        <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ink2">
                        Student Subjects
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                        {student
                            ? `${student.firstName} ${student.surname}${
                                  student.class
                                      ? ` — ${student.class.class_name} ${student.class.section}`
                                      : ''
                              }`
                            : 'View subjects'}
                    </p>
                </div>
                <Button variant="secondary" onClick={() => navigate('/management/students')}>
                    Back to Students
                </Button>
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
                {loading && <p className="p-6 text-sm text-muted">Loading subjects…</p>}
                {error && <p className="p-6 text-sm text-danger">{error}</p>}

                {!loading && !error && subjects.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-ink2">
                            No subjects found
                        </p>
                        <p className="mt-1 text-sm text-muted">
                            This student's class has no subjects assigned.
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
                                            {s.teacher
                                                ? `${s.teacher.first_name} ${s.teacher.surname}`
                                                : 'Unassigned'}
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
