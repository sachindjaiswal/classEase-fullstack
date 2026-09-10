import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getClasses } from '@/api/classes';
import { getScoresByClass, deleteScore } from '@/api/scores';
import { EXAM_TYPES } from './exams';
import type { SchoolClass, ScoreFull } from '@/types';
import Button from '@/components/Button';

export default function ScoresByClass() {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [examFilter, setExamFilter] = useState('all');
    const [semesterFilter, setSemesterFilter] = useState('all');
    const [scores, setScores] = useState<ScoreFull[]>([]);
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
        getScoresByClass(selectedClassId)
            .then((res) => setScores(res.data.scores))
            .catch(() => setError("Couldn't load scores."))
            .finally(() => setLoading(false));
    }, [selectedClassId]);

    const handleDelete = async (score: ScoreFull) => {
        if (!confirm(`Delete ${score.exam_type} score for ${score.student?.firstName ?? ''} ${score.student?.surname ?? ''}?`)) return;
        try {
            await deleteScore(score.id);
            setScores((prev) => prev.filter((s) => s.id !== score.id));
        } catch {
            alert('Failed to delete score.');
        }
    };

    const filtered =
        examFilter === 'all'
            ? scores
            : scores.filter((s) => s.exam_type === examFilter);
    const exams = EXAM_TYPES.filter((exam) => scores.some((s) => s.exam_type === exam));
    const semesters = [...new Set(scores.map((s) => s.semester))];
    const semesterFiltered =
        semesterFilter === 'all'
            ? filtered
            : filtered.filter((s) => s.semester === semesterFilter);

    return (
        <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ink2">Scores</h1>
                    <p className="mt-1 text-sm text-muted">
                        Track student marks per subject per exam
                    </p>
                </div>
                <Link to="/management/scores/new">
                    <Button>Add Score</Button>
                </Link>
            </div>

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
                                {c.class_name} — {c.section}
                            </option>
                        ))}
                    </select>
                </label>

                {semesters.length > 0 && (
                    <label className="flex max-w-xs flex-col gap-1.5 text-sm">
                        <span className="font-medium text-ink2">Semester</span>
                        <select
                            value={semesterFilter}
                            onChange={(e) => setSemesterFilter(e.target.value)}
                            className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                        >
                            <option value="all">All semesters</option>
                            {semesters.map((semester) => (
                                <option key={semester} value={semester}>
                                    {semester}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                {exams.length > 0 && (
                    <label className="flex max-w-xs flex-col gap-1.5 text-sm">
                        <span className="font-medium text-ink2">Exam</span>
                        <select
                            value={examFilter}
                            onChange={(e) => setExamFilter(e.target.value)}
                            className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                        >
                            <option value="all">All exams</option>
                            {exams.map((exam) => (
                                <option key={exam} value={exam}>
                                    {exam}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
                {loading && <p className="p-6 text-sm text-muted">Loading scores...</p>}
                {error && <p className="p-6 text-sm text-danger">{error}</p>}

                {!loading && !error && semesterFiltered.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-ink2">No scores recorded</p>
                        <p className="mt-1 text-sm text-muted">
                            Add a score for a student to get started.
                        </p>
                    </div>
                )}

                {!loading && !error && semesterFiltered.length > 0 && (
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
                                {semesterFiltered.map((s) => {
                                    const pct = s.total_marks ? Math.round((s.marks_obtained / s.total_marks) * 100) : 0;
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
                                                    onClick={() => navigate(`/management/scores/${s.id}/edit`, { state: { score: s } })}
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
    );
}