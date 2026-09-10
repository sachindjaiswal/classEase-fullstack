<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function markAttendance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'date' => 'required|date',
            'attendances' => 'required|array|min:1',
            'attendances.*.student_id' => 'required|exists:students,id',
            'attendances.*.status' => 'required|in:present,absent,late',
            'attendances.*.remarks' => 'nullable|string|max:255',
        ]);

        $teacherId = $request->user()->id;

        $teacher = Teacher::where('user_id', $teacherId)->first();

        foreach ($validated['attendances'] as $item) {
            Attendance::updateOrCreate(
                [
                    'student_id' => $item['student_id'],
                    'date' => $validated['date'],
                ],
                [
                    'class_id' => $validated['class_id'],
                    'status' => $item['status'],
                    'marked_by' => $teacher?->id,
                    'remarks' => $item['remarks'] ?? null,
                ]
            );
        }

        return response()->json([
            'message' => 'Attendance marked successfully',
        ], 200);
    }

    public function getAttendanceByClass(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'date' => 'required|date',
        ]);

        $students = Student::where('classId', $validated['class_id'])
            ->with(['attendance' => function ($query) use ($validated) {
                $query->where('date', $validated['date']);
            }])
            ->get();

        $attendance = $students->map(function ($student) {
            return [
                'student_id' => $student->id,
                'firstName' => $student->firstName,
                'surname' => $student->surname,
                'status' => $student->attendance->first()?->status,
                'remarks' => $student->attendance->first()?->remarks,
            ];
        });

        return response()->json([
            'date' => $validated['date'],
            'class_id' => $validated['class_id'],
            'attendance' => $attendance,
        ], 200);
    }

    public function getStudentAttendance(int $id): JsonResponse
    {
        $student = Student::find($id);

        if (! $student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        $attendance = Attendance::where('student_id', $id)
            ->with('class')
            ->orderBy('date', 'desc')
            ->get();

        $total = $attendance->count();
        $present = $attendance->where('status', 'present')->count();
        $absent = $attendance->where('status', 'absent')->count();
        $late = $attendance->where('status', 'late')->count();

        return response()->json([
            'student' => [
                'id' => $student->id,
                'firstName' => $student->firstName,
                'surname' => $student->surname,
            ],
            'summary' => [
                'total' => $total,
                'present' => $present,
                'absent' => $absent,
                'late' => $late,
            ],
            'attendance' => $attendance,
        ], 200);
    }

    public function updateAttendance(Request $request, int $id): JsonResponse
    {
        $record = Attendance::find($id);

        if (! $record) {
            return response()->json(['message' => 'Attendance record not found'], 404);
        }

        $validated = $request->validate([
            'status' => 'required|in:present,absent,late',
            'remarks' => 'nullable|string|max:255',
        ]);

        $record->update($validated);

        return response()->json([
            'message' => 'Attendance updated successfully',
            'attendance' => $record,
        ], 200);
    }
}
