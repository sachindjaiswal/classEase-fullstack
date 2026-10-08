import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getClasses } from '@/api/classes';
import { getSubjects } from '@/api/subjects';
import { getStudentsByClass } from '@/api/students';
import { updateScore, getScore } from '@/api/scores';
import { EXAM_TYPES } from './exams';
import type { SchoolClass, Subject, Student, ScoreFull } from '@/types';
import Button from '@/components/Button';

export default function EditScore() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const existing = (location.state as { score?: ScoreFull })?.score;

    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [form, setForm] = useState({
        class_id: '',
        subject_id: '',
        student_id: '',
        exam_type: EXAM_TYPES[0] as string,
        semester: 'current',
        marks_obtained: '',
        total_marks: '',
    });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(!existing);

    useEffect(() => {
        Promise.all([getClasses(), getSubjects()])
            .then(([classesRes, subjectsRes]) => {
                setClasses(classesRes.data.classes);
                setSubjects(subjectsRes.data.subjects);

                const fill = (s: ScoreFull) =>
                    setForm({
                        class_id: String(s.class_id),
                        subject_id: String(s.subject_id),
                        student_id: String(s.student_id),
                        exam_type: s.exam_type,
                        semester: s.semester,
                        marks_obtained: String(s.marks_obtained),
                        total_marks: String(s.total_marks),
                    });

                if (existing) {
                    fill(existing);
                } else if (id) {
                    getScore(Number(id))
                        .then((res) => fill(res.data.score))
                        .catch(() => navigate('/management/scores'))
                        .finally(() => setLoading(false));
                }
            })
            .catch(() => {});
    }, [id, existing, navigate]);

    useEffect(() => {
        if (form.class_id) {
            setFilteredSubjects(
                subjects.filter((s) => s.classId === Number(form.class_id))
            );
            getStudentsByClass(Number(form.class_id))
                .then((res) => setFilteredStudents(res.data))
                .catch(() => setFilteredStudents([]));
        } else {
            setFilteredSubjects([]);
            setFilteredStudents([]);
        }
    }, [form.class_id, subjects]);

    const update = (key: string, value: string) =>
        setForm((f) => ({ ...f, [key]: value }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            await updateScore(Number(id), {
                class_id: Number(form.class_id),
                subject_id: Number(form.subject_id),
                student_id: Number(form.student_id),
                exam_type: form.exam_type,
                semester: form.semester,
                marks_obtained: Number(form.marks_obtained),
                total_marks: Number(form.total_marks),
            });
            navigate('/management/scores');
        } catch (err: unknown) {
            const axiosErr = err as { response?: { status?: number; data?: { errors?: Record<string, string[]>; message?: string } } };
            const data = axiosErr?.response?.data;
            if (axiosErr?.response?.status === 409) {
                alert(data?.message ?? 'Score already exists for this student, subject and exam.');
                setErrors({});
            } else {
                setErrors(data?.errors ?? {});
            }
        } finally {
            setSaving(false);
        }
    };

    const fieldError = (key: string) => errors[key]?.[0];

    if (loading) {
        return <p className="p-6 text-sm text-muted">Loading score...</p>;
    }

    return (
        <div className="max-w-xl">
            <h1 className="text-2xl font-semibold text-ink2">Edit Score</h1>
            <p className="mt-1 text-sm text-muted">Update a student's marks</p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink2">Class</span>
                    <select
                        value={form.class_id}
                        onChange={(e) => update('class_id', e.target.value)}
                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                    >
                        <option value="">Select a class</option>
                        {classes.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.class_name} — {c.section}
                            </option>
                        ))}
                    </select>
                    {fieldError('class_id') && (
                        <span className="text-xs text-danger">{fieldError('class_id')}</span>
                    )}
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink2">Subject</span>
                    <select
                        value={form.subject_id}
                        onChange={(e) => update('subject_id', e.target.value)}
                        disabled={!form.class_id}
                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink disabled:opacity-50"
                    >
                        <option value="">Select a subject</option>
                        {filteredSubjects.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.subjectName}
                            </option>
                        ))}
                    </select>
                    {fieldError('subject_id') && (
                        <span className="text-xs text-danger">{fieldError('subject_id')}</span>
                    )}
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink2">Student</span>
                    <select
                        value={form.student_id}
                        onChange={(e) => update('student_id', e.target.value)}
                        disabled={!form.class_id}
                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink disabled:opacity-50"
                    >
                        <option value="">Select a student</option>
                        {filteredStudents.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.firstName} {s.surname}
                            </option>
                        ))}
                    </select>
                    {fieldError('student_id') && (
                        <span className="text-xs text-danger">{fieldError('student_id')}</span>
                    )}
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink2">Exam</span>
                    <select
                        value={form.exam_type}
                        onChange={(e) => update('exam_type', e.target.value)}
                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                    >
                        {EXAM_TYPES.map((exam) => (
                            <option key={exam} value={exam}>
                                {exam}
                            </option>
                        ))}
                    </select>
                    {fieldError('exam_type') && (
                        <span className="text-xs text-danger">{fieldError('exam_type')}</span>
                    )}
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium text-ink2">Semester</span>
                        <input
                            type="text"
                            value={form.semester}
                            onChange={(e) => update('semester', e.target.value)}
                            placeholder="e.g. Fall 2025"
                            className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                        />
                        {fieldError('semester') && (
                            <span className="text-xs text-danger">{fieldError('semester')}</span>
                        )}
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium text-ink2">Marks Obtained</span>
                        <input
                            type="number"
                            min={0}
                            value={form.marks_obtained}
                            onChange={(e) => update('marks_obtained', e.target.value)}
                            className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                        />
                        {fieldError('marks_obtained') && (
                            <span className="text-xs text-danger">{fieldError('marks_obtained')}</span>
                        )}
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium text-ink2">Total Marks</span>
                        <input
                            type="number"
                            min={1}
                            value={form.total_marks}
                            onChange={(e) => update('total_marks', e.target.value)}
                            className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                        />
                        {fieldError('total_marks') && (
                            <span className="text-xs text-danger">{fieldError('total_marks')}</span>
                        )}
                    </label>
                </div>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/management/scores')}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}