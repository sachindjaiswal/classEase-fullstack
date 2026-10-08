<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AttendanceCorrection;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceCorrectionController extends Controller
{
    private const STATUSES = ['present', 'absent', 'late'];

    public function store(Request $request): JsonResponse
    {
        $student = Student::where('user_id', $request->user()?->id)->first();

        if (! $student) {
            return response()->json(['message' => 'No student profile linked to this account'], 404);
        }

        $validated = $request->validate([
            'attendance_id' => 'required|exists:attendances,id',
            'requested_status' => 'required|in:'.implode(',', self::STATUSES),
            'message' => 'required|string|min:3|max:500',
        ]);

        $attendance = Attendance::find((int) $validated['attendance_id']);

        if (! $attendance) {
            return response()->json(['message' => 'Attendance record not found'], 404);
        }

        if ($attendance->student_id !== $student->id) {
            return response()->json(['message' => 'Not authorized to appeal this attendance record'], 403);
        }

        $pending = AttendanceCorrection::where('attendance_id', $attendance->id)
            ->where('status', 'pending')
            ->exists();

        if ($pending) {
            return response()->json(['message' => 'A pending appeal already exists for this attendance record'], 400);
        }

        $correction = AttendanceCorrection::create([
            ...$validated,
            'student_id' => $student->id,
            'previous_status' => $attendance->status,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Attendance appeal submitted successfully',
            'correction' => $correction->load([
                'student:id,firstName,surname',
                'attendance.class:id,class_name,section',
            ]),
        ], 201);
    }

    public function mine(Request $request): JsonResponse
    {
        $student = Student::where('user_id', $request->user()?->id)->first();

        if (! $student) {
            return response()->json(['message' => 'No student profile linked to this account'], 404);
        }

        $corrections = AttendanceCorrection::where('student_id', $student->id)
            ->with([
                'student:id,firstName,surname',
                'attendance.class:id,class_name,section',
                'handler:id,name',
            ])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'message' => 'Attendance appeals retrieved successfully',
            'corrections' => $corrections,
        ], 200);
    }

    public function index(Request $request): JsonResponse
    {
        $query = AttendanceCorrection::with([
            'student:id,firstName,surname',
            'attendance.class:id,class_name,section',
            'handler:id,name',
        ]);

        if ($request->user()?->role === 'teacher') {
            $teacher = Teacher::where('user_id', $request->user()->id)->first();

            if (! $teacher) {
                return response()->json(['message' => 'No teacher profile linked to this account'], 404);
            }

            $query->whereHas('attendance', function ($attendanceQuery) use ($teacher) {
                $attendanceQuery->where('marked_by', $teacher->id);
            });
        }

        if ($request->has('status')) {
            $status = $request->query('status');

            if (is_string($status) && in_array($status, ['pending', 'approved', 'rejected'], true)) {
                $query->where('status', $status);
            }
        }

        $corrections = $query->orderByRaw("FIELD(status, 'pending', 'approved', 'rejected'), created_at desc")->get();

        return response()->json([
            'message' => 'Attendance appeals retrieved successfully',
            'corrections' => $corrections,
        ], 200);
    }

    public function handle(Request $request, int $id): JsonResponse
    {
        $correction = AttendanceCorrection::with('attendance')->find($id);

        if (! $correction) {
            return response()->json(['message' => 'Attendance appeal not found'], 404);
        }

        if ($correction->status !== 'pending') {
            return response()->json(['message' => 'Attendance appeal has already been handled'], 400);
        }

        if ($correction->attendance === null) {
            return response()->json(['message' => 'Attendance record not found'], 404);
        }

        if ($request->user()?->role === 'teacher' && ! $this->teacherCanHandle($request, $correction)) {
            return response()->json(['message' => 'Not authorized to handle this attendance appeal'], 403);
        }

        $validated = $request->validate([
            'decision' => 'required|in:approved,rejected',
            'response_reason' => 'nullable|string|max:500',
        ]);

        if ($validated['decision'] === 'approved') {
            $correction->attendance->update(['status' => $correction->requested_status]);
        }

        $correction->update([
            'status' => $validated['decision'],
            'response_reason' => $validated['response_reason'] ?? null,
            'handled_by' => $request->user()?->id,
        ]);

        return response()->json([
            'message' => $validated['decision'] === 'approved'
                ? 'Attendance appeal approved'
                : 'Attendance appeal rejected',
            'correction' => $correction->load([
                'student:id,firstName,surname',
                'attendance.class:id,class_name,section',
                'handler:id,name',
            ]),
        ], 200);
    }

    private function teacherCanHandle(Request $request, AttendanceCorrection $correction): bool
    {
        $teacher = Teacher::where('user_id', $request->user()?->id)->first();

        return $teacher !== null && $correction->attendance?->marked_by === $teacher->id;
    }
}
