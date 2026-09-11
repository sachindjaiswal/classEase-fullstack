import { useEffect, useState } from 'react';
import { getClasses } from '@/api/classes';
import { getSubjects } from '@/api/subjects';
import { getTimetableByClass, saveTimetable } from '@/api/timetable';
import type { SchoolClass, Subject, TimetableDay, TimetableSlotInput } from '@/types';
import Button from '@/components/Button';

const DAYS: TimetableDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DEFAULT_PERIODS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

type Grid = Record<TimetableDay, Record<string, number | ''>>;

const emptyGrid = (periods: string[]): Grid => {
    const subjectMap = {} as Record<string, number | ''>;
    periods.forEach((p) => (subjectMap[p] = ''));

    const grid = {} as Grid;
    DAYS.forEach((d) => (grid[d] = { ...subjectMap }));
    return grid;
};

export default function TimetableGrid() {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [classId, setClassId] = useState('');
    const [periods, setPeriods] = useState<string[]>(DEFAULT_PERIODS);
    const [grid, setGrid] = useState<Grid>(emptyGrid(DEFAULT_PERIODS));
    const [classSubjects, setClassSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savingDay, setSavingDay] = useState<TimetableDay | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([getClasses(), getSubjects()])
            .then(([classesRes, subjectsRes]) => {
                setClasses(classesRes.data.classes);
                setSubjects(subjectsRes.data.subjects);
            })
            .catch(() => setError("Couldn't load classes/subjects."));
    }, []);

    useEffect(() => {
        if (!classId) {
            setClassSubjects([]);
            setGrid(emptyGrid(DEFAULT_PERIODS));
            setPeriods(DEFAULT_PERIODS);
            return;
        }

        setLoading(true);
        setError(null);

        getTimetableByClass(Number(classId))
            .then((res) => {
                const slots = res.data.timetable;
                const nextPeriods =
                    slots.length > 0
                        ? Array.from(new Set(slots.map((s) => s.period))).sort(
                              (a, b) => parseInt(a, 10) - parseInt(b, 10),
                          )
                        : DEFAULT_PERIODS;
                const nextGrid = emptyGrid(nextPeriods);
                slots.forEach((slot) => {
                    if (nextGrid[slot.day] && nextGrid[slot.day][slot.period] !== undefined) {
                        nextGrid[slot.day][slot.period] = slot.subject_id ?? '';
                    }
                });

                setPeriods(nextPeriods);
                setGrid(nextGrid);
            })
            .catch(() => setError("Couldn't load timetable."))
            .finally(() => setLoading(false));

        setClassSubjects(subjects.filter((s) => s.classId === Number(classId)));
    }, [classId, subjects]);

    const updateCell = (day: TimetableDay, period: string, subjectId: number | '') => {
        setGrid((g) => ({ ...g, [day]: { ...g[day], [period]: subjectId } }));
    };

    const addPeriod = () => {
        const nextNum = periods.length + 1;
        const label = `${nextNum}${nextNum === 1 ? 'st' : nextNum === 2 ? 'nd' : nextNum === 3 ? 'rd' : 'th'}`;
        const nextPeriods = [...periods, label];
        setPeriods(nextPeriods);
        setGrid((g) => {
            const next = { ...g };
            DAYS.forEach((d) => (next[d] = { ...next[d], [label]: '' }));
            return next;
        });
    };

    const removeLastPeriod = () => {
        if (periods.length <= 1) return;
        const last = periods[periods.length - 1];
        const nextPeriods = periods.slice(0, -1);
        setPeriods(nextPeriods);
        setGrid((g) => {
            const next = { ...g };
            DAYS.forEach((d) => {
                const { [last]: _removed, ...rest } = next[d];
                next[d] = rest;
            });
            return next;
        });
    };

    const buildSlots = (day?: TimetableDay): TimetableSlotInput[] => {
        const days = day ? [day] : DAYS;
        return periods.flatMap((period) =>
            days.map((d) => ({
                day: d,
                period,
                subject_id: grid[d][period] === '' ? null : Number(grid[d][period]),
                teacher_id: null,
                start_time: null,
                end_time: null,
            })),
        );
    };

    const handleSaveDay = async (day: TimetableDay) => {
        if (!classId) {
            setMessage(null);
            setError('Select a class first.');
            return;
        }
        setSavingDay(day);
        setMessage(null);
        setError(null);
        try {
            await saveTimetable({
                class_id: Number(classId),
                day,
                slots: buildSlots(day),
            });
            setMessage(`${day}'s schedule saved.`);
        } catch (err) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(message ?? `Failed to save ${day}.`);
            setMessage(null);
        } finally {
            setSavingDay(null);
        }
    };

    const handleSave = async () => {
        if (!classId) {
            setMessage(null);
            setError('Select a class first.');
            return;
        }
        setSaving(true);
        setMessage(null);
        setError(null);
        try {
            const res = await saveTimetable({
                class_id: Number(classId),
                slots: buildSlots(),
            });
            setMessage(`Timetable saved for ${periods.length} periods.`);
            setError(null);
            return res;
        } catch (err) {
            const apiMessage =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(apiMessage ?? 'Failed to save timetable.');
            setMessage(null);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div>
                <h1 className="text-2xl font-semibold text-ink2">Timetable</h1>
                <p className="mt-1 text-sm text-muted">
                    Set the weekly schedule (subjects) for each class
                </p>
            </div>

            <label className="mt-6 flex max-w-xs flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink2">Class</span>
                <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                >
                    <option value="">Select a class</option>
                    {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.class_name} — {c.section}
                        </option>
                    ))}
                </select>
            </label>

            {message && (
                <p className="mt-4 rounded-md bg-green-100 px-3 py-2 text-sm text-green-800">
                    {message}
                </p>
            )}
            {error && (
                <p className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
                    {error}
                </p>
            )}

            {loading && <p className="mt-6 text-sm text-muted">Loading timetable...</p>}

            {!loading && classId && (
                <div className="mt-5">
                    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-base text-xs uppercase tracking-wide text-muted">
                                <tr>
                                    <th className="whitespace-nowrap px-4 py-3 font-medium">Period</th>
                                    {DAYS.map((d) => (
                                        <th key={d} className="whitespace-nowrap px-4 py-3 font-medium">
                                            {d}
                                        </th>
                                    ))}
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {periods.map((period) => (
                                    <tr key={period}>
                                        <td className="whitespace-nowrap px-4 py-2 text-muted">
                                            <span className="font-medium text-ink2">{period}</span>{' '}
                                            period
                                        </td>
                                        {DAYS.map((day) => (
                                            <td key={day} className="px-2 py-2">
                                                <select
                                                    value={grid[day][period] === undefined ? '' : grid[day][period]}
                                                    onChange={(e) =>
                                                        updateCell(
                                                            day,
                                                            period,
                                                            e.target.value === ''
                                                                ? ''
                                                                : Number(e.target.value),
                                                        )
                                                    }
                                                    className="w-40 rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-ink"
                                                >
                                                    <option value="">—</option>
                                                    {classSubjects.map((s) => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.subjectName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                        ))}
                                        <td className="px-2 py-2"></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Button type="button" variant="secondary" onClick={addPeriod}>
                            + Add period
                        </Button>
                        <Button type="button" variant="secondary" onClick={removeLastPeriod}>
                            − Remove last period
                        </Button>
                        <Button type="button" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save timetable'}
                        </Button>
                    </div>
                </div>
            )}

            {!loading && !classId && (
                <div className="mt-6 rounded-lg border border-border bg-surface p-10 text-center">
                    <p className="text-sm font-medium text-ink2">Select a class to view its timetable</p>
                    <p className="mt-1 text-sm text-muted">
                        Then set the subject for each period and day.
                    </p>
                </div>
            )}
        </div>
    );
}