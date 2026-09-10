import type { TimetableDay, TimetableSlot } from '@/types';

const DAYS: TimetableDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function TimetableView({ slots }: { slots: TimetableSlot[] }) {
    const periods = Array.from(new Set(slots.map((s) => s.period))).sort(
        (a, b) => parseInt(a, 10) - parseInt(b, 10),
    );

    const cellFor = (day: TimetableDay, period: string): TimetableSlot | undefined =>
        slots.find((s) => s.day === day && s.period === period);

    if (periods.length === 0) {
        return (
            <div className="rounded-lg border border-border bg-surface p-10 text-center">
                <p className="text-sm font-medium text-ink2">No timetable yet</p>
                <p className="mt-1 text-sm text-muted">No periods have been scheduled.</p>
            </div>
        );
    }

    return (
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
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {periods.map((period) => (
                        <tr key={period}>
                            <td className="whitespace-nowrap px-4 py-3">
                                <span className="font-medium text-ink2">{period}</span>
                            </td>
                            {DAYS.map((day) => {
                                const slot = cellFor(day, period);
                                return (
                                    <td key={day} className="px-4 py-3 align-top">
                                        {slot?.subject ? (
                                            <div>
                                                <p className="font-medium text-ink2">
                                                    {slot.subject.subjectName}
                                                </p>
                                                {slot.teacher && (
                                                    <p className="mt-0.5 text-xs text-muted">
                                                        {slot.teacher.first_name}{' '}
                                                        {slot.teacher.surname}
                                                    </p>
                                                )}
                                                {slot.start_time && (
                                                    <p className="mt-0.5 text-xs text-muted">
                                                        {slot.start_time}
                                                        {slot.end_time
                                                            ? ` – ${slot.end_time}`
                                                            : ''}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted">—</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}