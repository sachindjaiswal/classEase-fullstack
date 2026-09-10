import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTeacherMe, getTeacherSubjects } from '@/api/teachers';
import { getStudentsByClass } from '@/api/students';
import { getScoresByClass, createScore, updateScore, deleteScore } from '@/api/scores';
import { EXAM_TYPES } from '@/pages/management/Scores/exams';
import type { ClassSummary, Student, SubjectFull, ScoreFull } from '@/types';
import Button from '@/components/Button';

const classesFromSubjects = (subjects: SubjectFull[]): ClassSummary[] => {
    const map = new Map<number, ClassSummary>();
    subjects.forEach((s) => {
        map.set(
            s.classId,
            s.class ?? { id: s.classId, class_name: `Class ${s.classId}` },
        );
    });
    return Array.from(map.values());
};

export default function TeacherScores() {
    const { user } = useAuth();
    const [subjects, setSubjects] = useState<SubjectFull[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [scores, setScores] = useState<ScoreFull[]>([]);
    const [form, setForm] = useState<{
        student_id: string;
        exam_type: string;
        semester: string;
        marks_obtained: string;
        total_marks: string;
    }>({
        student_id: '',
        exam_type: EXAM_TYPES[0],
        semester: 'current',
        marks_obtained: '',
        total_marks: '',
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        getTeacherMe()
            .then((res) => getTeacherSubjects(res.data.id))
            .then((res) => {
                setSubjects(res.data.subjects);
                const classes = classesFromSubjects(res.data.subjects);
                if (classes.length > 0) {
                    setSelectedClassId(classes[0].id);
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [user]);

    const classes = useMemo(() => classesFromSubjects(subjects), [subjects]);
    const classSubjects = useMemo(
        () => subjects.filter((s) => s.classId === selectedClassId),
        [subjects, selectedClassId],
    );

    useEffect(() => {
        if (selectedClassId === null) return;

        setScores([]);
        setSelectedSubjectId((prev) => {
            const first = subjects
                .filter((s) => s.classId === selectedClassId)
                .map((s) => s.id)
                .find((id) => prev === null || prev === id);
            return first ?? null;
        });

        getStudentsByClass(selectedClassId)
            .then((res) => setStudents(res.data))
            .catch(() => setStudents([]));

        getScoresByClass(selectedClassId)
            .then((res) => setScores(res.data.scores))
            .catch(() => setError("Couldn't load scores."));
    }, [selectedClassId, subjects]);

    const filteredScores = useMemo(
        () => scores.filter((s) => s.subject_id === selectedSubjectId),
        [scores, selectedSubjectId],
    );

    const update = (key: string, value: string) =>
        setForm((f) => ({ ...f, [key]: value }));

    const resetForm = () => {
        setForm({
            student_id: '',
            exam_type: EXAM_TYPES[0],
            semester: 'current',
            marks_obtained: '',
            total_marks: '',
        });
        setEditingId(null);
        setErrors({});
    };

    const fieldError = (key: string) => errors[key]?.[0];

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (selectedClassId === null || selectedSubjectId === null) return;
        setSaving(true);
        setErrors({});
        const payload = {
            class_id: selectedClassId,
            subject_id: selectedSubjectId,
            student_id: Number(form.student_id),
            exam_type: form.exam_type,
            semester: form.semester,
            marks_obtained: Number(form.marks_obtained),
            total_marks: Number(form.total_marks),
        };
        try {
            if (editingId) {
                await updateScore(editingId, payload);
            } else {
                await createScore(payload);
            }
            resetForm();
            const res = await getScoresByClass(selectedClassId);
            setScores(res.data.scores);
        } catch (err: unknown) {
            const axiosErr = err as {
                response?: { status?: number; data?: { errors?: Record<string, string[]>; message?: string } };
            };
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

    const startEdit = (score: ScoreFull) => {
        setEditingId(score.id);
        setForm({
            student_id: String(score.student_id),
            exam_type: score.exam_type,
            semester: score.semester,
            marks_obtained: String(score.marks_obtained),
            total_marks: String(score.total_marks),
        });
        setErrors({});
    };

    const handleDelete = async (score: ScoreFull) => {
        if (!confirm(`Delete ${score.exam_type} score for ${score.student?.firstName ?? ''} ${score.student?.surname ?? ''}?`)) return;
        try {
            await deleteScore(score.id);
            setScores((prev) => prev.filter((s) => s.id !== score.id));
        } catch {
            alert('Failed to delete score.');
        }
    };

    return (
        <div>
            <div>
                <h1 className="text-2xl font-semibold text-ink2">Marks</h1>
                <p className="mt-1 text-sm text-muted">
                    Enter and manage marks for the subjects you teach
                </p>
            </div>

            {loading && <p className="mt-6 text-sm text-muted">Loading...</p>}
            {error && <p className="mt-6 text-sm text-danger">{error}</p>}

            {!loading && classes.length === 0 && (
                <div className="mt-6 rounded-lg border border-border bg-surface p-10 text-center">
                    <p className="text-sm font-medium text-ink2">No classes assigned</p>
                    <p className="mt-1 text-sm text-muted">
                        You need subjects assigned to a class before you can enter marks.
                    </p>
                </div>
            )}

            {!loading && classes.length > 0 && (
                <div>
                    <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                        <label className="flex max-w-xs flex-col gap-1.5 text-sm">
                            <span className="font-medium text-ink2">Class</span>
                            <select
                                value={selectedClassId ?? ''}
                                onChange={(e) => setSelectedClassId(Number(e.target.value))}
                                className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                            >
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.class_name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="flex max-w-xs flex-col gap-1.5 text-sm">
                            <span className="font-medium text-ink2">Subject</span>
                            <select
                                value={selectedSubjectId ?? ''}
                                onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                                className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                            >
                                <option value="">Select a subject</option>
                                {classSubjects.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.subjectName}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-4 rounded-lg border border-border bg-surface p-5">
                        <p className="text-sm font-medium text-ink2">
                            {editingId ? 'Edit marks' : 'Record marks'}
                        </p>

                        <label className="flex flex-col gap-1.5 text-sm">
                            <span className="font-medium text-ink2">Student</span>
                            <select
                                value={form.student_id}
                                onChange={(e) => update('student_id', e.target.value)}
                                className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                            >
                                <option value="">Select a student</option>
                                {students.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.firstName} {s.surname}
                                    </option>
                                ))}
                            </select>
                            {fieldError('student_id') && (
                                <span className="text-xs text-danger">{fieldError('student_id')}</span>
                            )}
                        </label>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Record Marks'}
                            </Button>
                            {editingId && (
                                <Button type="button" variant="secondary" onClick={resetForm}>
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </form>

                    <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
                        {filteredScores.length === 0 ? (
                            <div className="p-10 text-center">
                                <p className="text-sm font-medium text-ink2">No marks recorded</p>
                                <p className="mt-1 text-sm text-muted">
                                    Record marks for a student to get started.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-base text-xs uppercase tracking-wide text-muted">
                                        <tr>
                                            <th className="whitespace-nowrap px-5 py-3 font-medium">Student</th>
                                            <th className="whitespace-nowrap px-5 py-3 font-medium">Subject</th>
                                            <th className="whitespace-nowrap px-5 py-3 font-medium">Exam</th>
                                            <th className="whitespace-nowrap px-5 py-3 font-medium">Semester</th>
                                            <th className="whitespace-nowrap px-5 py-3 font-medium">Marks</th>
                                            <th className="whitespace-nowrap px-5 py-3 font-medium">Percentage</th>
                                            <th className="whitespace-nowrap px-5 py-3 font-medium"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredScores.map((s) => {
                                            const pct = s.total_marks
                                                ? Math.round((s.marks_obtained / s.total_marks) * 100)
                                                : 0;
                                            return (
                                                <tr key={s.id} className="hover:bg-base/60">
                                                    <td className="whitespace-nowrap px-5 py-3 font-medium text-ink2">
                                                        {s.student?.firstName} {s.student?.surname}
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-3 text-muted">
                                                        {s.subject?.subjectName ?? '-'}
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-3 text-muted">
                                                        {s.exam_type}
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-3 text-muted">
                                                        {s.semester}
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-3 data-figure text-muted">
                                                        {s.marks_obtained}/{s.total_marks}
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-3 data-figure font-medium text-ink2">
                                                        {pct}%
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-3 text-right">
                                                        <button
                                                            onClick={() => startEdit(s)}
                                                            className="mr-4 text-sm font-medium text-ink hover:underline"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(s)}
                                                            className="text-sm font-medium text-danger hover:underline"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}