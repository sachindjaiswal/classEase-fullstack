import { useEffect, useState } from 'react';
import { getClasses } from '@/api/classes';
import { getLeaderboardByClass } from '@/api/leaderboard';
import { getScoresByClass } from '@/api/scores';
import { EXAM_TYPES } from '@/pages/management/Scores/exams';
import type { LeaderboardEntry, SchoolClass } from '@/types';

const MEDAL_STYLES: Record<number, string> = {
    1: 'bg-gold text-white',
    2: 'bg-slate-300 text-slate-800',
    3: 'bg-amber-700 text-white',
};

export default function LeaderboardByClass() {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [examFilter, setExamFilter] = useState('all');
    const [semesterFilter, setSemesterFilter] = useState('current');
    const [availableSemesters, setAvailableSemesters] = useState<string[]>([]);
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        getScoresByClass(selectedClassId)
            .then((res) => {
                setAvailableSemesters([...new Set(res.data.scores.map((s) => s.semester))]);
            })
            .catch(() => {});
    }, [selectedClassId]);

    useEffect(() => {
        if (selectedClassId === null) return;
        setLoading(true);
        setError(null);
        getLeaderboardByClass(
            selectedClassId,
            examFilter === 'all' ? undefined : examFilter,
            semesterFilter,
        )
            .then((res) => setEntries(res.data.leaderboard))
            .catch(() => setError("Couldn't load the leaderboard."))
            .finally(() => setLoading(false));
    }, [selectedClassId, examFilter, semesterFilter]);

    const studentName = (entry: LeaderboardEntry) =>
        entry.student
            ? `${entry.student.firstName} ${entry.student.surname}`
            : 'Unknown student';

    return (
        <div>
            <div>
                <h1 className="text-2xl font-semibold text-ink2">Leaderboard</h1>
                <p className="mt-1 text-sm text-muted">
                    Rank students by performance across exams
                </p>
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

                <label className="flex max-w-xs flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink2">Semester</span>
                    <select
                        value={semesterFilter}
                        onChange={(e) => setSemesterFilter(e.target.value)}
                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                    >
                        {availableSemesters.length === 0 && (
                            <option value="current">current</option>
                        )}
                        {availableSemesters.map((semester) => (
                            <option key={semester} value={semester}>
                                {semester}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="flex max-w-xs flex-col gap-1.5 text-sm">
                    <span className="font-medium text-ink2">Exam</span>
                    <select
                        value={examFilter}
                        onChange={(e) => setExamFilter(e.target.value)}
                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                    >
                        <option value="all">All exams</option>
                        {EXAM_TYPES.map((exam) => (
                            <option key={exam} value={exam}>
                                {exam}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
                {loading && <p className="p-6 text-sm text-muted">Loading leaderboard...</p>}
                {error && <p className="p-6 text-sm text-danger">{error}</p>}

                {!loading && !error && entries.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-ink2">No scores to rank</p>
                        <p className="mt-1 text-sm text-muted">
                            Record scores for this class to populate the leaderboard.
                        </p>
                    </div>
                )}

                {!loading && !error && entries.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-base text-xs uppercase tracking-wide text-muted">
                                <tr>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Rank</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Student</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Exams</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Marks</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Average</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {entries.map((entry) => (
                                    <tr key={entry.student?.id ?? entry.rank} className="hover:bg-base/60">
                                        <td className="whitespace-nowrap px-5 py-3">
                                            <span
                                                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                                                    MEDAL_STYLES[entry.rank] ?? 'bg-base text-muted'
                                                }`}
                                            >
                                                {entry.rank}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 font-medium text-ink2">
                                            {studentName(entry)}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-muted">
                                            {entry.exams_count}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 data-figure text-muted">
                                            {entry.marks_obtained}/{entry.total_marks}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 data-figure font-medium text-ink2">
                                            {entry.average_percentage.toFixed(2)}%
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