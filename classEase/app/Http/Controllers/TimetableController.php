<?php

namespace App\Http\Controllers;

use App\Models\classes;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\Timetable;
use App\Rules\TenantExists;
use Illuminate\Database\Eloquent\Builder;
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
            'class_id' => ['required', TenantExists::make('classes')],
            'day' => ['nullable', 'string', 'in:'.implode(',', self::DAYS)],
            'slots' => ['required', 'array'],
            'slots.*.day' => ['required', 'string', 'in:'.implode(',', self::DAYS)],
            'slots.*.period' => ['required', 'string', 'max:50'],
            'slots.*.subject_id' => ['nullable', TenantExists::make('subjects')],
            'slots.*.teacher_id' => ['nullable', TenantExists::make('teachers')],
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

        $existingEntries = $existingQuery
            ->get()
            ->keyBy(fn (Timetable $entry): string => $entry->day.'|'.$entry->period);

        $keysToRemove = array_diff($existingEntries->keys()->all(), $submittedKey);

        if ($keysToRemove !== []) {
            $pairs = array_map(
                static function (string $key): array {
                    [$existingDay, $period] = explode('|', $key, 2);

                    return ['day' => $existingDay, 'period' => $period];
                },
                $keysToRemove,
            );

            Timetable::where('class_id', $classId)
                ->where(function (Builder $query) use ($pairs): void {
                    foreach ($pairs as $pair) {
                        $query->orWhere(function (Builder $inner) use ($pair): void {
                            $inner->where('day', $pair['day'])->where('period', $pair['period']);
                        });
                    }
                })
                ->delete();
        }

        $subjectTeacherMap = Subject::whereIn('id', array_values(array_filter(array_map(
            static fn (array $slot): ?int => isset($slot['subject_id']) ? (int) $slot['subject_id'] : null,
            $slots,
        ))))->pluck('teacherId', 'id');

        foreach ($slots as $slot) {
            $subjectId = $slot['subject_id'] ?? null;
            $teacherId = $slot['teacher_id'] ?? null;

            if ($teacherId === null && $subjectId !== null) {
                $teacherId = $subjectTeacherMap->get((int) $subjectId);
            }

            $key = $slot['day'].'|'.$slot['period'];
            $entry = $existingEntries->get($key);

            $attributes = [
                'class_id' => $classId,
                'subject_id' => $subjectId,
                'teacher_id' => $teacherId,
                'start_time' => $slot['start_time'] ?? null,
                'end_time' => $slot['end_time'] ?? null,
            ];

            if ($entry instanceof Timetable) {
                $entry->fill($attributes)->save();
            } else {
                Timetable::create(array_merge($attributes, [
                    'day' => $slot['day'],
                    'period' => $slot['period'],
                ]));
            }
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
            'subject_id' => ['nullable', TenantExists::make('subjects')],
            'teacher_id' => ['nullable', TenantExists::make('teachers')],
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
