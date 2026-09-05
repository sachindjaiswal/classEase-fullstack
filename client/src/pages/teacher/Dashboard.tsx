import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTeacher } from '@/api/teachers';
import { getTeacherSubjects } from '@/api/teachers';
import type { Teacher, SubjectFull } from '@/types';

export default function TeacherDashboard() {
    const { user } = useAuth();
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [subjects, setSubjects] = useState<SubjectFull[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        getTeacher(user.id)
            .then((res) => {
                setTeacher(res.data);
                return getTeacherSubjects(user.id);
            })
            .then((res) => {
                setSubjects(res.data.subjects);
            })
            .catch(() => setError("Couldn't load dashboard data."))
            .finally(() => setLoading(false));
    }, [user]);

    return (
        <div>
            <h1 className="text-2xl font-semibold text-ink2">Teacher Dashboard</h1>
            <p className="mt-1 text-sm text-muted">Welcome back, {user?.name}</p>

            {loading && (
                <p className="mt-6 text-sm text-muted">Loading...</p>
            )}

            {error && (
                <p className="mt-6 text-sm text-danger">{error}</p>
            )}

            {!loading && !error && teacher && (
                <div className="mt-6 space-y-6">
                    <div className="rounded-lg border border-border bg-surface p-5">
                        <h2 className="text-sm font-medium text-muted">Your Info</h2>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <p className="text-xs text-muted">Name</p>
                                <p className="text-sm font-medium text-ink2">
                                    {teacher.first_name} {teacher.surname}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted">Email</p>
                                <p className="text-sm font-medium text-ink2">{teacher.email}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted">Designation</p>
                                <p className="text-sm font-medium text-ink2">{teacher.designation}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted">Contact</p>
                                <p className="text-sm font-medium text-ink2">{teacher.contact}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-border bg-surface p-5">
                        <h2 className="text-sm font-medium text-muted">
                            Your Subjects ({subjects.length})
                        </h2>
                        {subjects.length === 0 ? (
                            <p className="mt-3 text-sm text-muted">No subjects assigned yet.</p>
                        ) : (
                            <div className="mt-3 divide-y divide-border">
                                {subjects.map((s) => (
                                    <div key={s.id} className="py-2">
                                        <p className="text-sm font-medium text-ink2">{s.subjectName}</p>
                                        <p className="text-xs text-muted">Class ID: {s.classId}</p>
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
