import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getStudent } from '@/api/students';
import { getStudentSubjects } from '@/api/students';
import type { Student, SubjectFull } from '@/types';

export default function StudentDashboard() {
    const { user } = useAuth();
    const [student, setStudent] = useState<Student | null>(null);
    const [subjects, setSubjects] = useState<SubjectFull[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        getStudent(user.id)
            .then((res) => {
                setStudent(res.data.student);
                return getStudentSubjects(user.id);
            })
            .then((res) => {
                setSubjects(res.data.subjects);
            })
            .catch(() => setError("Couldn't load dashboard data."))
            .finally(() => setLoading(false));
    }, [user]);

    return (
        <div>
            <h1 className="text-2xl font-semibold text-ink2">Student Dashboard</h1>
            <p className="mt-1 text-sm text-muted">Welcome back, {user?.name}</p>

            {loading && (
                <p className="mt-6 text-sm text-muted">Loading...</p>
            )}

            {error && (
                <p className="mt-6 text-sm text-danger">{error}</p>
            )}

            {!loading && !error && student && (
                <div className="mt-6 space-y-6">
                    <div className="rounded-lg border border-border bg-surface p-5">
                        <h2 className="text-sm font-medium text-muted">Your Info</h2>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <p className="text-xs text-muted">Name</p>
                                <p className="text-sm font-medium text-ink2">
                                    {student.firstName} {student.surname}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted">Email</p>
                                <p className="text-sm font-medium text-ink2">{student.email}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted">Contact</p>
                                <p className="text-sm font-medium text-ink2">{student.contact}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted">Parent Contact</p>
                                <p className="text-sm font-medium text-ink2">{student.parentContact}</p>
                            </div>
                        </div>
                    </div>

                    {student.class && (
                        <div className="rounded-lg border border-border bg-surface p-5">
                            <h2 className="text-sm font-medium text-muted">Your Class</h2>
                            <div className="mt-3">
                                <p className="text-lg font-semibold text-ink2">
                                    {student.class.class_name} — {student.class.section}
                                </p>
                                <p className="text-xs text-muted">Room {student.class.room_no}</p>
                            </div>
                        </div>
                    )}

                    <div className="rounded-lg border border-border bg-surface p-5">
                        <h2 className="text-sm font-medium text-muted">
                            Your Subjects ({subjects.length})
                        </h2>
                        {subjects.length === 0 ? (
                            <p className="mt-3 text-sm text-muted">No subjects found.</p>
                        ) : (
                            <div className="mt-3 divide-y divide-border">
                                {subjects.map((s) => (
                                    <div key={s.id} className="py-2">
                                        <p className="text-sm font-medium text-ink2">{s.subjectName}</p>
                                        {s.teacher && (
                                            <p className="text-xs text-muted">
                                                Teacher: {s.teacher.first_name} {s.teacher.surname}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
