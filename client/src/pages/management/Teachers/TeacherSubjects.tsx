import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTeacher, getTeacherSubjects } from '@/api/teachers';
import type { Teacher, SubjectFull } from '@/types';
import Button from '@/components/Button';

export default function TeacherSubjects() {
    const { id } = useParams();
    const navigate = useNavigate();
    const teacherId = Number(id);

    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [subjects, setSubjects] = useState<SubjectFull[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!teacherId) return;
        setLoading(true);
        setError(null);
        getTeacher(teacherId)
            .then((res) => {
                setTeacher(res.data);
                return getTeacherSubjects(teacherId);
            })
            .then((res) => setSubjects(res.data.subjects))
            .catch(() => setError("Couldn't load the teacher's subjects."))
            .finally(() => setLoading(false));
    }, [teacherId]);

    return (
        <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ink2">
                        Teacher Subjects
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                        {teacher
                            ? `${teacher.first_name} ${teacher.surname} — ${teacher.designation}`
                            : 'View subjects'}
                    </p>
                </div>
                <Button variant="secondary" onClick={() => navigate('/management/teachers')}>
                    Back to Teachers
                </Button>
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
                {loading && <p className="p-6 text-sm text-muted">Loading subjects…</p>}
                {error && <p className="p-6 text-sm text-danger">{error}</p>}

                {!loading && !error && subjects.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-ink2">
                            No subjects assigned
                        </p>
                        <p className="mt-1 text-sm text-muted">
                            This teacher does not teach any subjects yet.
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
