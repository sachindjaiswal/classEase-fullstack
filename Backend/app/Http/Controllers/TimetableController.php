<?php

namespace App\Http\Controllers;

use App\Models\classes;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\Timetable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimetableController extends Controller
{
    public const DAYS = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
    ];

    public function saveTimetable(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'class_id' => ['required', 'exists:classes,id'],
            'day' => ['nullable', 'string', 'in:'.implode(',', self::DAYS)],
            'slots' => ['required', 'array'],
            'slots.*.day' => ['required', 'string', 'in:'.implode(',', self::DAYS)],
            'slots.*.period' => ['required', 'string', 'max:50'],
            'slots.*.subject_id' => ['nullable', 'exists:subjects,id'],
            'slots.*.teacher_id' => ['nullable', 'exists:teachers,id'],
            'slots.*.start_time' => ['nullable', 'date_format:H:i'],
            'slots.*.end_time' => ['nullable', 'date_format:H:i'],
        ]);

        $classId = $validated['class_id'];
        $day = $validated['day'] ?? null;

        $slots = $day !== null
            ? array_values(array_filter(
                $validated['slots'],
                static fn (array $slot): bool => $slot['day'] === $day,
            ))
            : $validated['slots'];

        $submittedKey = array_map(
            static fn (array $slot): string => $slot['day'].'|'.$slot['period'],
            $slots,
        );

        $existingQuery = Timetable::where('class_id', $classId);
        if ($day !== null) {
            $existingQuery->where('day', $day);
        }

        $existingKey = $existingQuery
            ->get(['day', 'period'])
            ->map(fn (Timetable $entry) => $entry->day.'|'.$entry->period)
            ->all();

        $conflict = $this->teacherConflict($classId, $slots);

        if ($conflict) {
            return response()->json([
                'message' => "{$conflict['teacher_name']} already has a ".$conflict['period'].' '.
                    'period lecture on '.$conflict['day'].' in '.$conflict['conflict_class'].
                    ' — a teacher can\'t teach two classes at the same time.',
            ], 409);
        }

        foreach (array_diff($existingKey, $submittedKey) as $key) {
            [$existingDay, $period] = explode('|', $key, 2);

            Timetable::where('class_id', $classId)
                ->where('day', $existingDay)
                ->where('period', $period)
                ->delete();
        }

        foreach ($slots as $slot) {
            $subjectId = $slot['subject_id'] ?? null;
            $teacherId = $slot['teacher_id'] ?? null;

            if ($teacherId === null && $subjectId !== null) {
                $teacherId = Subject::whereKey($subjectId)->first()?->teacherId;
            }

            Timetable::updateOrCreate(
                [
                    'class_id' => $classId,
                    'day' => $slot['day'],
                    'period' => $slot['period'],
                ],
                [
                    'subject_id' => $subjectId,
                    'teacher_id' => $teacherId,
                    'start_time' => $slot['start_time'] ?? null,
                    'end_time' => $slot['end_time'] ?? null,
                ]
            );
        }

        return response()->json([
            'message' => 'Timetable saved successfully',
            'timetable' => $this->timetableForClass($classId),
        ], 200);
    }

    public function getTimetableByClass(int $classId): JsonResponse
    {
        if (! classes::find($classId)) {
            return response()->json(['message' => 'Class not found'], 404);
        }

        return response()->json([
            'message' => 'Timetable retrieved successfully',
            'timetable' => $this->timetableForClass($classId),
        ], 200);
    }

    public function getTimetableByTeacher(int $teacherId): JsonResponse
    {
        if (! Teacher::find($teacherId)) {
            return response()->json(['message' => 'Teacher not found'], 404);
        }

        $timetable = Timetable::with(['class', 'subject', 'teacher'])
            ->where('teacher_id', $teacherId)
            ->orderBy('day')
            ->orderByRaw('CAST(period AS UNSIGNED)')
            ->get();

        return response()->json([
            'message' => 'Timetable retrieved successfully',
            'timetable' => $timetable,
        ], 200);
    }

    public function updateTimetable(Request $request, int $id): JsonResponse
    {
        $entry = Timetable::find($id);

        if (! $entry) {
            return response()->json(['message' => 'Timetable entry not found'], 404);
        }

        $validated = $request->validate([
            'day' => ['sometimes', 'string', 'in:'.implode(',', self::DAYS)],
            'period' => ['sometimes', 'string', 'max:50'],
            'subject_id' => ['nullable', 'exists:subjects,id'],
            'teacher_id' => ['nullable', 'exists:teachers,id'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time' => ['nullable', 'date_format:H:i'],
        ]);

        $day = $validated['day'] ?? $entry->day;
        $period = $validated['period'] ?? $entry->period;
        $subjectId = $validated['subject_id'] ?? $entry->subject_id;
        $subject = $subjectId !== null ? Subject::whereKey($subjectId)->first() : null;
        $subjectTeacherId = $subject !== null ? $subject->teacherId : null;
        $teacherId = isset($validated['teacher_id'])
            ? (int) $validated['teacher_id']
            : ($subjectTeacherId ?? $entry->teacher_id);

        if (! isset($validated['teacher_id']) && $teacherId !== null) {
            $validated['teacher_id'] = $teacherId;
        }

        $conflict = $this->teacherConflictFor(
            $entry->class_id,
            $entry->id,
            $day,
            $period,
            $teacherId,
        );

        if ($conflict) {
            return response()->json([
                'message' => "{$conflict['teacher_name']} already has a ".$period.' '.
                    'period lecture on '.$day.' in '.$conflict['conflict_class'].
                    ' — a teacher can\'t teach two classes at the same time.',
            ], 409);
        }

        $entry->update($validated);

        return response()->json([
            'message' => 'Timetable entry updated successfully',
            'entry' => $entry->load(['class', 'subject', 'teacher']),
        ], 200);
    }

    public function deleteTimetable(int $id): JsonResponse
    {
        $entry = Timetable::find($id);

        if (! $entry) {
            return response()->json(['message' => 'Timetable entry not found'], 404);
        }

        $entry->delete();

        return response()->json([
            'message' => 'Timetable entry deleted successfully',
        ], 200);
    }

    /**
     * Check that no teacher is double-booked at the same day+period across classes.
     *
     * @param  array<int, array<string, mixed>>  $slots
     * @return array{teacher_name: string, day: string, period: string, conflict_class: string}|null
     */
    private function teacherConflict(int $classId, array $slots): ?array
    {
        foreach ($slots as $slot) {
            $subjectId = $slot['subject_id'] ?? null;
            $teacherId = isset($slot['teacher_id']) ? (int) $slot['teacher_id'] : null;

            if ($teacherId === null && $subjectId !== null) {
                $teacherId = Subject::whereKey($subjectId)->first()?->teacherId;
            }

            if ($teacherId === null) {
                continue;
            }

            $conflict = $this->teacherConflictFor(
                $classId,
                null,
                $slot['day'],
                $slot['period'],
                $teacherId,
            );

            if ($conflict) {
                return $conflict;
            }
        }

        return null;
    }

    /**
     * Find another class where the given teacher is already scheduled for the
     * given day+period. Pass an entry id to exclude the row being updated.
     *
     * @return array{teacher_name: string, day: string, period: string, conflict_class: string}|null
     */
    private function teacherConflictFor(
        int $classId,
        ?int $ignoreEntryId,
        string $day,
        string $period,
        ?int $teacherId,
    ): ?array {
        if ($teacherId === null) {
            return null;
        }

        $entry = Timetable::with('class')
            ->where('teacher_id', $teacherId)
            ->where('day', $day)
            ->where('period', $period)
            ->where('class_id', '!=', $classId)
            ->when($ignoreEntryId !== null, fn ($query) => $query->where('id', '!=', $ignoreEntryId))
            ->first();

        if (! $entry) {
            return null;
        }

        $teacher = Teacher::find($teacherId);

        return [
            'teacher_name' => $teacher ? trim($teacher->first_name.' '.$teacher->surname) : "Teacher #{$teacherId}",
            'day' => $day,
            'period' => $period,
            'conflict_class' => $entry->class ? $entry->class->class_name : "Class #{$entry->class_id}",
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function timetableForClass(int $classId): array
    {
        return Timetable::with(['class', 'subject', 'teacher'])
            ->where('class_id', $classId)
            ->orderBy('period', 'asc')
            ->get()
            ->toArray();
    }
}
