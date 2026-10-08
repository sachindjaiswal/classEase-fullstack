import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMyStudent } from '@/api/students';
import { getTimetableByClass } from '@/api/timetable';
import TimetableView from '@/components/TimetableView';
import type { Student, TimetableSlot } from '@/types';

export default function StudentTimetable() {
    const { user } = useAuth();
    const [slots, setSlots] = useState<TimetableSlot[]>([]);
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        getMyStudent()
            .then((res) => {
                const student = res.data.student;
                setStudent(student);
                const classId = student.class?.id;
                if (!classId) {
                    setError('You are not assigned to any class yet.');
                    return;
                }
                return getTimetableByClass(classId);
            })
            .then((res) => {
                if (res) setSlots(res.data.timetable);
            })
            .catch(() => setError("Couldn't load your timetable."))
            .finally(() => setLoading(false));
    }, [user]);

    return (
        <div>
            <h1 className="text-2xl font-semibold text-ink2">My Timetable</h1>
            <p className="mt-1 text-sm text-muted">
                {student?.class
                    ? `${student.class.class_name} — ${student.class.section}`
                    : 'Your weekly class schedule'}
            </p>

            {loading && <p className="mt-6 text-sm text-muted">Loading timetable...</p>}
            {error && (
                <p className="mt-6 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
            )}
            {!loading && !error && (
                <div className="mt-6">
                    <TimetableView slots={slots} />
                </div>
            )}
        </div>
    );
}