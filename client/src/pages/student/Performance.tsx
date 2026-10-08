import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMyStudent, getStudentsByClass, getStudentSubjects } from '@/api/students';
import { getStudentScores, getScoresByClass } from '@/api/scores';
import { getClasses } from '@/api/classes';
import { getLeaderboardByClass } from '@/api/leaderboard';
import {
    getHeadToHead,
    getSubjectComparison,
    getStudentGaps,
    getStudentProgress,
} from '@/api/comparison';
import { EXAM_TYPES } from '@/pages/management/Scores/exams';
import type {
    HeadToHeadResponse,
    LeaderboardEntry,
    ProgressResponse,
    SchoolClass,
    Student,
    StudentGapsResponse,
    SubjectComparisonResponse,
    SubjectFull,
} from '@/types';

type Tab = 'classmates' | 'rank' | 'focus' | 'progress' | 'headtohead';

const STUDENT_TABS: { id: Tab; label: string }[] = [
    { id: 'classmates', label: 'vs Classmates' },
    { id: 'rank', label: 'Class Rank' },
    { id: 'focus', label: 'Where to Focus' },
    { id: 'progress', label: 'My Progress' },
    { id: 'headtohead', label: 'Head-to-Head' },
];

const STAFF_TABS: { id: Tab; label: string }[] = [
    { id: 'headtohead', label: 'Head-to-Head' },
];

const MEDAL_STYLES: Record<number, string> = {
    1: 'bg-gold text-white',
    2: 'bg-slate-300 text-slate-800',
    3: 'bg-amber-700 text-white',
};

const TREND_STYLES: Record<string, { symbol: string; className: string }> = {
    up: { symbol: '▲', className: 'text-emerald-600' },
    down: { symbol: '▼', className: 'text-danger' },
    same: { symbol: '→', className: 'text-muted' },
    'n/a': { symbol: '', className: 'text-muted' },
};

function SemesterSelect({
    value,
    onChange,
    semesters,
}: {
    value: string;
    onChange: (v: string) => void;
    semesters: string[];
}) {
    return (
        <label className="flex max-w-xs flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink2">Semester</span>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
            >
                {semesters.length === 0 && <option value="current">current</option>}
                {semesters.map((semester) => (
                    <option key={semester} value={semester}>
                        {semester}
                    </option>
                ))}
            </select>
        </label>
    );
}

export default function StudentPerformance() {
    const { user } = useAuth();
    const isStaff = user?.role === 'management' || user?.role === 'teacher';
    const [student, setStudent] = useState<Student | null>(null);
    const [subjects, setSubjects] = useState<SubjectFull[]>([]);
    const [semesters, setSemesters] = useState<string[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [roster, setRoster] = useState<Student[]>([]);
    const [tab, setTab] = useState<Tab>(isStaff ? 'headtohead' : 'classmates');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
    const [examFilter, setExamFilter] = useState('all');
    const [semesterFilter, setSemesterFilter] = useState('current');

    const [comparison, setComparison] = useState<SubjectComparisonResponse | null>(null);
    const [comparisonLoading, setComparisonLoading] = useState(false);

    const [gaps, setGaps] = useState<StudentGapsResponse | null>(null);
    const [gapsLoading, setGapsLoading] = useState(false);

    const [progress, setProgress] = useState<ProgressResponse | null>(null);
    const [progressLoading, setProgressLoading] = useState(false);

    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
    const [studentAId, setStudentAId] = useState<number | null>(null);
    const [studentBId, setStudentBId] = useState<number | null>(null);
    const [headToHead, setHeadToHead] = useState<HeadToHeadResponse | null>(null);
    const [headToHeadLoading, setHeadToHeadLoading] = useState(false);

    const [rankEntries, setRankEntries] = useState<LeaderboardEntry[]>([]);
    const [rankLoading, setRankLoading] = useState(false);
    const [rankError, setRankError] = useState<string | null>(null);

    const tabs = isStaff ? STAFF_TABS : STUDENT_TABS;

    useEffect(() => {
        if (!user) return;

        if (user.role === 'student') {
            getMyStudent()
                .then((res) => {
                    const s = res.data.student;
                    setStudent(s);
                    return getStudentSubjects(s.id);
                })
                .then((res) => setSubjects(res.data.subjects))
                .catch(() => setError("Couldn't load your profile."))
                .finally(() => setLoading(false));
        } else {
            getClasses()
                .then((res) => {
                    const list = res.data.classes;
                    setClasses(list);
                    if (list.length > 0) setSelectedClassId(list[0].id);
                })
                .catch(() => setError("Couldn't load classes."))
                .finally(() => setLoading(false));
        }
    }, [user]);

    useEffect(() => {
        if (user?.role !== 'student') return;

        getMyStudent()
            .then((res) =>
                getStudentScores(res.data.student.id).then((r) =>
                    setSemesters([...new Set(r.data.scores.map((x) => x.semester))]),
                ),
            )
            .catch(() => {});
    }, [user]);

    useEffect(() => {
        if (user?.role !== 'student') return;
        if (!student?.class) return;

        getStudentsByClass(student.class.id)
            .then((res) => setRoster(res.data.filter((s) => s.id !== student?.id)))
            .catch(() => {});
    }, [user, student]);

    useEffect(() => {
        if (!isStaff) return;
        if (selectedClassId === null) return;

        getStudentsByClass(selectedClassId)
            .then((res) => {
                setRoster(res.data);
                if (res.data.length > 0) setStudentAId(res.data[0].id);
                if (res.data.length > 1) setStudentBId(res.data[1].id);
            })
            .catch(() => setRoster([]));

        getScoresByClass(selectedClassId)
            .then((res) =>
                setSemesters([...new Set(res.data.scores.map((s) => s.semester))]),
            )
            .catch(() => {});
    }, [isStaff, selectedClassId]);

    useEffect(() => {
        if (tab !== 'classmates') return;
        if (!student?.class || selectedSubjectId === null) return;

        setComparisonLoading(true);
        setError(null);
        getSubjectComparison(student.class.id, selectedSubjectId, {
            exam: examFilter === 'all' ? undefined : examFilter,
            semester: semesterFilter,
        })
            .then((res) => setComparison(res.data))
            .catch(() => setError("Couldn't load the comparison."))
            .finally(() => setComparisonLoading(false));
    }, [tab, student, selectedSubjectId, examFilter, semesterFilter]);

    useEffect(() => {
        if (tab !== 'focus') return;
        if (!student) return;

        setGapsLoading(true);
        setError(null);
        getStudentGaps(student.id, semesterFilter)
            .then((res) => setGaps(res.data))
            .catch(() => setError("Couldn't load performance gaps."))
            .finally(() => setGapsLoading(false));
    }, [tab, student, semesterFilter]);

    useEffect(() => {
        if (tab !== 'progress') return;
        if (!student) return;

        setProgressLoading(true);
        setError(null);
        getStudentProgress(student.id)
            .then((res) => setProgress(res.data))
            .catch(() => setError("Couldn't load your progress."))
            .finally(() => setProgressLoading(false));
    }, [tab, student]);

    useEffect(() => {
        if (isStaff) setTab('headtohead');
    }, [isStaff]);

    useEffect(() => {
        if (tab !== 'rank') return;
        if (!student?.class) return;

        setRankLoading(true);
        setRankError(null);
        getLeaderboardByClass(
            student.class.id,
            examFilter === 'all' ? undefined : examFilter,
            semesterFilter,
        )
            .then((res) => setRankEntries(res.data.leaderboard))
            .catch(() => setRankError("Couldn't load the class ranking."))
            .finally(() => setRankLoading(false));
    }, [tab, student, examFilter, semesterFilter]);

    useEffect(() => {
        if (tab !== 'headtohead') return;

        const aId = isStaff ? studentAId : student?.id ?? null;
        const bId = studentBId;

        if (aId === null || bId === null || aId === bId) {
            setHeadToHead(null);
            return;
        }

        setHeadToHeadLoading(true);
        setError(null);
        getHeadToHead(aId, bId, semesterFilter)
            .then((res) => setHeadToHead(res.data))
            .catch(() => setError("Couldn't load the head-to-head comparison."))
            .finally(() => setHeadToHeadLoading(false));
    }, [tab, isStaff, student, studentAId, studentBId, semesterFilter]);

    const tabButton = (t: Tab) =>
        `rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === t
                ? 'bg-ink text-white'
                : 'text-ink2 hover:bg-base'
        }`;

    const formatPct = (value: number | null | undefined) =>
        value === null || value === undefined ? '—' : `${value}%`;

    const showSemesterFilter = tab === 'classmates' || tab === 'rank' || tab === 'focus';

    return (
        <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ink2">Performance</h1>
                    <p className="mt-1 text-sm text-muted">
                        {isStaff
                            ? 'Compare any two students side by side'
                            : 'Compare yourself with classmates and track your own progress'}
                    </p>
                </div>
                <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={tabButton(t.id)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading && <p className="mt-6 text-sm text-muted">Loading...</p>}
            {error && <p className="mt-6 text-sm text-danger">{error}</p>}
            {!loading && !error && !isStaff && !student && (
                <p className="mt-6 text-sm text-muted">
                    No student profile linked to this account.
                </p>
            )}

            {!loading && !error && (isStaff || student) && (
                <div className="mt-6 space-y-6">
                    {tab === 'headtohead' && (
                        <>
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                                {isStaff ? (
                                    <>
                                        <label className="flex max-w-xs flex-col gap-1.5 text-sm">
                                            <span className="font-medium text-ink2">
                                                Class
                                            </span>
                                            <select
                                                value={selectedClassId ?? ''}
                                                onChange={(e) =>
                                                    setSelectedClassId(
                                                        Number(e.target.value),
                                                    )
                                                }
                                                className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                                            >
                                                <option value="">
                                                    Select a class
                                                </option>
                                                {classes.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.class_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className="flex max-w-xs flex-col gap-1.5 text-sm">
                                            <span className="font-medium text-ink2">
                                                Student A
                                            </span>
                                            <select
                                                value={studentAId ?? ''}
                                                onChange={(e) =>
                                                    setStudentAId(Number(e.target.value))
                                                }
                                                className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                                            >
                                                <option value="">
                                                    Pick a student
                                                </option>
                                                {roster.map((s) => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.firstName} {s.surname}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className="flex max-w-xs flex-col gap-1.5 text-sm">
                                            <span className="font-medium text-ink2">
                                                Student B
                                            </span>
                                            <select
                                                value={studentBId ?? ''}
                                                onChange={(e) =>
                                                    setStudentBId(Number(e.target.value))
                                                }
                                                className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                                            >
                                                <option value="">
                                                    Pick a student
                                                </option>
                                                {roster
                                                    .filter((s) => s.id !== studentAId)
                                                    .map((s) => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.firstName} {s.surname}
                                                        </option>
                                                    ))}
                                            </select>
                                        </label>
                                    </>
                                ) : (
                                    <label className="flex max-w-xs flex-col gap-1.5 text-sm">
                                        <span className="font-medium text-ink2">
                                            Compare with
                                        </span>
                                        <select
                                            value={studentBId ?? ''}
                                            onChange={(e) =>
                                                setStudentBId(Number(e.target.value))
                                            }
                                            className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                                        >
                                            <option value="">
                                                Pick a classmate
                                            </option>
                                            {roster.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.firstName} {s.surname}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                )}

                                <SemesterSelect
                                    value={semesterFilter}
                                    onChange={setSemesterFilter}
                                    semesters={semesters}
                                />
                            </div>

                            {headToHeadLoading && (
                                <p className="text-sm text-muted">Comparing...</p>
                            )}

                            {!headToHeadLoading && !headToHead && (
                                <div className="rounded-lg border border-border bg-surface p-10 text-center">
                                    <p className="text-sm font-medium text-ink2">
                                        Pick two students to compare
                                    </p>
                                    <p className="mt-1 text-sm text-muted">
                                        {isStaff
                                            ? 'Choose a class, then student A and student B.'
                                            : 'Choose a classmate to compare yourself with.'}
                                    </p>
                                </div>
                            )}

                            {!headToHeadLoading && headToHead && (
                                <>
                                    <div className="rounded-lg border border-border bg-surface p-5">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                                <div className="min-w-[10rem]">
                                                    <p className="text-xs text-muted">
                                                        Student A
                                                        {headToHead.studentA_is_you && (
                                                            <span className="ml-2 rounded bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
                                                                You
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="mt-0.5 font-semibold text-ink2">
                                                        {headToHead.studentA.firstName}{' '}
                                                        {headToHead.studentA.surname}
                                                    </p>
                                                </div>
                                                <p className="data-figure text-2xl font-bold text-gold">
                                                    vs
                                                </p>
                                                <div className="min-w-[10rem]">
                                                    <p className="text-xs text-muted">
                                                        Student B
                                                        {headToHead.studentB_is_you && (
                                                            <span className="ml-2 rounded bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
                                                                You
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="mt-0.5 font-semibold text-ink2">
                                                        {headToHead.studentB.firstName}{' '}
                                                        {headToHead.studentB.surname}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted">
                                                Semester:{' '}
                                                <span className="font-medium text-ink2">
                                                    {headToHead.semester}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    {headToHead.results.length === 0 ? (
                                        <div className="rounded-lg border border-border bg-surface p-10 text-center">
                                            <p className="text-sm font-medium text-ink2">
                                                No comparable scores yet
                                            </p>
                                            <p className="mt-1 text-sm text-muted">
                                                Pick a different semester or wait for scores to
                                                be recorded.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                                                <div className="rounded-lg border border-border bg-surface p-5">
                                                    <p className="text-sm font-medium text-muted">
                                                        Subjects compared
                                                    </p>
                                                    <p className="data-figure mt-1 text-2xl font-semibold text-ink2">
                                                        {headToHead.summary.head_to_head_subjects}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg border border-border bg-surface p-5">
                                                    <p className="text-sm font-medium text-muted">
                                                        {headToHead.studentA.firstName} wins
                                                    </p>
                                                    <p className="data-figure mt-1 text-2xl font-semibold text-emerald-600">
                                                        {headToHead.summary.studentA_wins}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg border border-border bg-surface p-5">
                                                    <p className="text-sm font-medium text-muted">
                                                        {headToHead.studentB.firstName} wins
                                                    </p>
                                                    <p className="data-figure mt-1 text-2xl font-semibold text-danger">
                                                        {headToHead.summary.studentB_wins}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg border border-border bg-surface p-5">
                                                    <p className="text-sm font-medium text-muted">
                                                        Ties
                                                    </p>
                                                    <p className="data-figure mt-1 text-2xl font-semibold text-ink2">
                                                        {headToHead.summary.ties}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="overflow-hidden rounded-lg border border-border bg-surface">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-sm">
                                                        <thead className="bg-base text-xs uppercase tracking-wide text-muted">
                                                            <tr>
                                                                <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                                    Subject
                                                                </th>
                                                                <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                                    {headToHead.studentA.firstName}{' '}
                                                                    {headToHead.studentA.surname}
                                                                </th>
                                                                <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                                    {headToHead.studentB.firstName}{' '}
                                                                    {headToHead.studentB.surname}
                                                                </th>
                                                                <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                                    Delta
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border">
                                                            {headToHead.results.map((entry) => {
                                                                const deltaLabel =
                                                                    entry.delta === null
                                                                        ? '—'
                                                                        : `${entry.delta > 0 ? '+' : ''}${entry.delta.toFixed(2)}%`;
                                                                const deltaClass =
                                                                    entry.leader === 'A'
                                                                        ? 'text-emerald-600'
                                                                        : entry.leader === 'B'
                                                                          ? 'text-danger'
                                                                          : 'text-muted';
                                                                const badge =
                                                                    entry.leader === 'A'
                                                                        ? 'bg-emerald-100 text-emerald-700'
                                                                        : entry.leader === 'B'
                                                                          ? 'bg-red-100 text-red-700'
                                                                          : 'bg-base text-muted';
                                                                return (
                                                                    <tr key={entry.subject.id}>
                                                                        <td className="whitespace-nowrap px-5 py-3 font-medium text-ink2">
                                                                            {entry.subject.subjectName}
                                                                        </td>
                                                                        <td className="whitespace-nowrap px-5 py-3 data-figure font-semibold text-ink2">
                                                                            {formatPct(
                                                                                entry.studentA_percentage,
                                                                            )}
                                                                        </td>
                                                                        <td className="whitespace-nowrap px-5 py-3 data-figure font-semibold text-ink2">
                                                                            {formatPct(
                                                                                entry.studentB_percentage,
                                                                            )}
                                                                        </td>
                                                                        <td className="whitespace-nowrap px-5 py-3">
                                                                            <span
                                                                                className={`data-figure font-medium ${deltaClass}`}
                                                                            >
                                                                                {deltaLabel}
                                                                            </span>
                                                                            {entry.leader !==
                                                                                'n/a' && (
                                                                                <span
                                                                                    className={`ml-2 rounded px-2 py-0.5 text-xs font-medium ${badge}`}
                                                                                >
                                                                                    {entry.leader ===
                                                                                    'A'
                                                                                        ? `${headToHead.studentA.firstName} ahead`
                                                                                        : entry.leader ===
                                                                                            'B'
                                                                                          ? `${headToHead.studentB.firstName} ahead`
                                                                                          : 'Level'}
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {tab === 'classmates' && (
                        <>
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <label className="flex max-w-xs flex-col gap-1.5 text-sm">
                                    <span className="font-medium text-ink2">Subject</span>
                                    <select
                                        value={selectedSubjectId ?? ''}
                                        onChange={(e) =>
                                            setSelectedSubjectId(Number(e.target.value))
                                        }
                                        className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                                    >
                                        <option value="">Select a subject</option>
                                        {subjects.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.subjectName}
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

                                <SemesterSelect
                                    value={semesterFilter}
                                    onChange={setSemesterFilter}
                                    semesters={semesters}
                                />
                            </div>

                            <div className="overflow-hidden rounded-lg border border-border bg-surface">
                                {comparisonLoading && (
                                    <p className="p-6 text-sm text-muted">
                                        Loading comparison...
                                    </p>
                                )}

                                {!comparisonLoading && comparison && (
                                    <>
                                        {comparison.entries.length === 0 ? (
                                            <div className="p-10 text-center">
                                                <p className="text-sm font-medium text-ink2">
                                                    No scores in this class for this subject
                                                </p>
                                                <p className="mt-1 text-sm text-muted">
                                                    Try a different subject, exam or semester.
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-sm">
                                                        <thead className="bg-base text-xs uppercase tracking-wide text-muted">
                                                            <tr>
                                                                <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                                    Student
                                                                </th>
                                                                <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                                    Marks
                                                                </th>
                                                                <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                                    Percentage
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border">
                                                            {comparison.entries.map((entry) => (
                                                                <tr
                                                                    key={entry.student?.id ?? 0}
                                                                    className={
                                                                        entry.is_you
                                                                            ? 'bg-emerald-50'
                                                                            : 'hover:bg-base/60'
                                                                    }
                                                                >
                                                                    <td className="whitespace-nowrap px-5 py-3 font-medium text-ink2">
                                                                        {entry.student?.firstName}{' '}
                                                                        {entry.student?.middleName}{' '}
                                                                        {entry.student?.surname}
                                                                        {entry.is_you && (
                                                                            <span className="ml-2 rounded bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
                                                                                You
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="whitespace-nowrap px-5 py-3 data-figure text-muted">
                                                                        {entry.marks_obtained}/
                                                                        {entry.total_marks}
                                                                    </td>
                                                                    <td className="whitespace-nowrap px-5 py-3 data-figure font-medium text-ink2">
                                                                        {entry.percentage.toFixed(2)}%
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border px-5 py-4 text-sm">
                                                    <p className="text-muted">
                                                        Class average:{' '}
                                                        <span className="font-medium text-ink2">
                                                            {comparison.summary.class_average.toFixed(2)}%
                                                        </span>
                                                    </p>
                                                    <p className="text-muted">
                                                        Highest:{' '}
                                                        <span className="font-medium text-ink2">
                                                            {comparison.summary.max.toFixed(2)}%
                                                        </span>
                                                    </p>
                                                    <p className="text-muted">
                                                        Lowest:{' '}
                                                        <span className="font-medium text-ink2">
                                                            {comparison.summary.min.toFixed(2)}%
                                                        </span>
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {tab === 'rank' && (
                        <>
                            <div className="flex flex-col gap-4 sm:flex-row">
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

                                <SemesterSelect
                                    value={semesterFilter}
                                    onChange={setSemesterFilter}
                                    semesters={semesters}
                                />
                            </div>

                            {rankLoading && (
                                <p className="text-sm text-muted">Loading class ranking...</p>
                            )}
                            {rankError && <p className="text-sm text-danger">{rankError}</p>}

                            {!rankLoading && !rankError && rankEntries.length === 0 && (
                                <div className="rounded-lg border border-border bg-surface p-10 text-center">
                                    <p className="text-sm font-medium text-ink2">
                                        No scores to rank yet
                                    </p>
                                    <p className="mt-1 text-sm text-muted">
                                        Your class needs recorded scores for this semester/exam
                                        before a ranking can be computed.
                                    </p>
                                </div>
                            )}

                            {!rankLoading && !rankError && rankEntries.length > 0 && (
                                <>
                                    {(() => {
                                        const myEntry = rankEntries.find(
                                            (e) => e.student?.id === student?.id,
                                        );
                                        return (
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                <div className="rounded-lg border border-border bg-surface p-5">
                                                    <p className="text-sm font-medium text-muted">
                                                        Your rank
                                                    </p>
                                                    <p
                                                        className={`data-figure mt-1 text-2xl font-semibold ${
                                                            myEntry
                                                                ? 'text-ink2'
                                                                : 'text-danger'
                                                        }`}
                                                    >
                                                        {myEntry
                                                            ? `#${myEntry.rank}`
                                                            : 'Unranked'}
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted">
                                                        {myEntry
                                                            ? `of ${rankEntries.length} students in your class`
                                                            : 'No scores recorded for this semester/exam'}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg border border-border bg-surface p-5">
                                                    <p className="text-sm font-medium text-muted">
                                                        Your average
                                                    </p>
                                                    <p className="data-figure mt-1 text-2xl font-semibold text-ink2">
                                                        {myEntry
                                                            ? `${myEntry.average_percentage.toFixed(2)}%`
                                                            : '—'}
                                                    </p>
                                                    {myEntry && (
                                                        <p className="mt-1 text-xs text-muted">
                                                            {myEntry.marks_obtained}/
                                                            {myEntry.total_marks} marks across{' '}
                                                            {myEntry.exams_count} exams
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="rounded-lg border border-border bg-surface p-5">
                                                    <p className="text-sm font-medium text-muted">
                                                        Class topper
                                                    </p>
                                                    <p className="data-figure mt-1 text-2xl font-semibold text-gold">
                                                        {rankEntries[0]?.student
                                                            ? `${rankEntries[0].student.firstName} ${rankEntries[0].student.surname}`
                                                            : '—'}
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted">
                                                        {rankEntries[0]
                                                            ? `${rankEntries[0].average_percentage.toFixed(2)}% average`
                                                            : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <div className="overflow-hidden rounded-lg border border-border bg-surface">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-base text-xs uppercase tracking-wide text-muted">
                                                    <tr>
                                                        <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                            Rank
                                                        </th>
                                                        <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                            Student
                                                        </th>
                                                        <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                            Exams
                                                        </th>
                                                        <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                            Marks
                                                        </th>
                                                        <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                            Average
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {rankEntries.map((entry) => {
                                                        const isYou =
                                                            entry.student?.id === student?.id;
                                                        return (
                                                            <tr
                                                                key={entry.student?.id ?? entry.rank}
                                                                className={
                                                                    isYou
                                                                        ? 'bg-emerald-50'
                                                                        : 'hover:bg-base/60'
                                                                }
                                                            >
                                                                <td className="whitespace-nowrap px-5 py-3">
                                                                    <span
                                                                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                                                                            MEDAL_STYLES[entry.rank] ??
                                                                            'bg-base text-muted'
                                                                        }`}
                                                                    >
                                                                        {entry.rank}
                                                                    </span>
                                                                </td>
                                                                <td className="whitespace-nowrap px-5 py-3 font-medium text-ink2">
                                                                    {entry.student?.firstName}{' '}
                                                                    {entry.student?.middleName}{' '}
                                                                    {entry.student?.surname}
                                                                    {isYou && (
                                                                        <span className="ml-2 rounded bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
                                                                            You
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="whitespace-nowrap px-5 py-3 text-muted">
                                                                    {entry.exams_count}
                                                                </td>
                                                                <td className="whitespace-nowrap px-5 py-3 data-figure text-muted">
                                                                    {entry.marks_obtained}/
                                                                    {entry.total_marks}
                                                                </td>
                                                                <td className="whitespace-nowrap px-5 py-3 data-figure font-medium text-ink2">
                                                                    {entry.average_percentage.toFixed(2)}%
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {tab === 'focus' && (
                        <>
                            <SemesterSelect
                                value={semesterFilter}
                                onChange={setSemesterFilter}
                                semesters={semesters}
                            />

                            {gapsLoading && (
                                <p className="text-sm text-muted">Analysing your gaps...</p>
                            )}

                            {!gapsLoading && gaps && gaps.gaps.length === 0 && (
                                <div className="rounded-lg border border-border bg-surface p-10 text-center">
                                    <p className="text-sm font-medium text-ink2">
                                        No data to analyse yet
                                    </p>
                                    <p className="mt-1 text-sm text-muted">
                                        Record scores for this semester to see where to focus.
                                    </p>
                                </div>
                            )}

                            {!gapsLoading &&
                                gaps &&
                                gaps.gaps.map((gap) => (
                                    <div
                                        key={gap.subject.id}
                                        className="rounded-lg border border-border bg-surface p-5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-base font-semibold text-ink2">
                                                {gap.subject.subjectName}
                                            </h3>
                                            {gap.gap_to_top3 > 0 && (
                                                <span className="rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-ink2">
                                                    {gap.gap_to_top3.toFixed(2)}% behind the top
                                                </span>
                                            )}
                                            {gap.gap_to_top3 <= 0 && (
                                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                    At or above the top-3 average
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                            <div>
                                                <p className="text-xs text-muted">Your average</p>
                                                <p className="data-figure text-lg font-semibold text-ink2">
                                                    {gap.my_percentage.toFixed(2)}%
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted">Top 3 average</p>
                                                <p className="data-figure text-lg font-semibold text-ink2">
                                                    {gap.top3_average.toFixed(2)}%
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted">Class average</p>
                                                <p className="data-figure text-lg font-semibold text-ink2">
                                                    {gap.class_average.toFixed(2)}%
                                                </p>
                                            </div>
                                        </div>
                                        <p className="mt-4 text-sm text-muted">
                                            {gap.gap_to_top3 > 0
                                                ? `Physics you're ${gap.gap_to_top3.toFixed(2)}% behind the top performers — the biggest opportunity to improve your standing.`
                                                : 'You are performing at or above the level of the top 3 students in this subject.'}
                                        </p>
                                    </div>
                                ))}
                        </>
                    )}

                    {tab === 'progress' && (
                        <>
                            {progressLoading && (
                                <p className="text-sm text-muted">Loading your progress...</p>
                            )}

                            {!progressLoading &&
                                progress &&
                                progress.progress.length === 0 && (
                                    <div className="rounded-lg border border-border bg-surface p-10 text-center">
                                        <p className="text-sm font-medium text-ink2">
                                            No progress data yet
                                        </p>
                                        <p className="mt-1 text-sm text-muted">
                                            Your previous-semester and current-semester scores will
                                            appear here.
                                        </p>
                                    </div>
                                )}

                            {!progressLoading && progress && progress.progress.length > 0 && (
                                <>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                        <div className="rounded-lg border border-border bg-surface p-5">
                                            <p className="text-sm font-medium text-muted">
                                                Overall change
                                            </p>
                                            <p
                                                className={`data-figure mt-1 text-2xl font-semibold ${
                                                    (progress.summary.overall_delta ?? 0) >= 0
                                                        ? 'text-emerald-600'
                                                        : 'text-danger'
                                                }`}
                                            >
                                                {progress.summary.overall_delta === null
                                                    ? '—'
                                                    : `${progress.summary.overall_delta >= 0 ? '+' : ''}${progress.summary.overall_delta.toFixed(2)}%`}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-border bg-surface p-5">
                                            <p className="text-sm font-medium text-muted">
                                                Improved subjects
                                            </p>
                                            <p className="mt-1 text-2xl font-semibold text-emerald-600">
                                                {progress.summary.improved_subjects}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-border bg-surface p-5">
                                            <p className="text-sm font-medium text-muted">
                                                Declined subjects
                                            </p>
                                            <p className="mt-1 text-2xl font-semibold text-danger">
                                                {progress.summary.declined_subjects}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="overflow-hidden rounded-lg border border-border bg-surface">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-base text-xs uppercase tracking-wide text-muted">
                                                    <tr>
                                                        <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                            Subject
                                                        </th>
                                                        <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                            Previous
                                                        </th>
                                                        <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                            Current
                                                        </th>
                                                        <th className="whitespace-nowrap px-5 py-3 font-medium">
                                                            Change
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {progress.progress.map((entry) => {
                                                        const trend = TREND_STYLES[entry.trend] ?? TREND_STYLES[`n/a`];
                                                        return (
                                                            <tr key={entry.subject.id}>
                                                                <td className="whitespace-nowrap px-5 py-3 font-medium text-ink2">
                                                                    {entry.subject.subjectName}
                                                                </td>
                                                                <td className="whitespace-nowrap px-5 py-3 text-muted">
                                                                    <span className="text-xs">
                                                                        {entry.previous_semester ?? '—'}
                                                                    </span>
                                                                    <span className="data-figure ml-2">
                                                                        {formatPct(entry.previous_percentage)}
                                                                    </span>
                                                                </td>
                                                                <td className="whitespace-nowrap px-5 py-3 data-figure font-medium text-ink2">
                                                                    {formatPct(entry.current_percentage)}
                                                                </td>
                                                                <td className="whitespace-nowrap px-5 py-3">
                                                                    <span className={trend.className}>
                                                                        <span className="data-figure">
                                                                            {trend.symbol}
                                                                        </span>{' '}
                                                                        {entry.delta === null
                                                                            ? '—'
                                                                            : `${entry.delta > 0 ? '+' : ''}${entry.delta.toFixed(2)}%`}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}