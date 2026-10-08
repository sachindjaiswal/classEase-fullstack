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
