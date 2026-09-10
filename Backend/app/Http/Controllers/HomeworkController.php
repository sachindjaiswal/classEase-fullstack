<?php

namespace App\Http\Controllers;

use App\Models\Homework;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HomeworkController extends Controller
{
    private function canManageSubject(?Teacher $teacher, Request $request, int $subjectId): bool
    {
        if ($request->user()->role === 'admin') {
            return true;
        }

        $subject = Subject::find($subjectId);

        return $teacher !== null && $subject !== null && $subject->teacherId === $teacher->id;
    }

    public function createHomework(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'subject_id' => 'required|exists:subjects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:assigned_date',
        ]);

        $teacher = Teacher::where('user_id', $request->user()->id)->first();

        if (! $this->canManageSubject($teacher, $request, $validated['subject_id'])) {
            return response()->json(['message' => 'You can only assign homework for your own subjects'], 403);
        }

        $homework = Homework::create([
            ...$validated,
            'assigned_by' => $teacher?->id,
        ]);

        return response()->json([
            'message' => 'Homework created successfully',
            'homework' => $homework->load(['class', 'subject', 'teacher']),
        ], 201);
    }

    public function getHomeworkByClass(int $classId): JsonResponse
    {
        $homeworks = Homework::where('class_id', $classId)
            ->with(['subject', 'teacher'])
            ->orderBy('due_date', 'desc')
            ->get();

        return response()->json([
            'message' => 'Homework retrieved successfully',
            'homeworks' => $homeworks,
        ], 200);
    }

    public function getHomework(int $id): JsonResponse
    {
        $homework = Homework::with(['class', 'subject', 'teacher'])->find($id);

        if (! $homework) {
            return response()->json(['message' => 'Homework not found'], 404);
        }

        return response()->json([
            'message' => 'Homework retrieved successfully',
            'homework' => $homework,
        ], 200);
    }

    public function updateHomework(Request $request, int $id): JsonResponse
    {
        $homework = Homework::find($id);

        if (! $homework) {
            return response()->json(['message' => 'Homework not found'], 404);
        }

        $teacher = Teacher::where('user_id', $request->user()->id)->first();

        if ($request->user()->role !== 'admin' && $homework->assigned_by !== $teacher?->id) {
            return response()->json(['message' => 'You can only update homework you assigned'], 403);
        }

        $validated = $request->validate([
            'class_id' => 'sometimes|exists:classes,id',
            'subject_id' => 'sometimes|exists:subjects,id',
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'assigned_date' => 'sometimes|date',
            'due_date' => 'sometimes|date',
        ]);

        if (isset($validated['subject_id']) && ! $this->canManageSubject($teacher, $request, $validated['subject_id'])) {
            return response()->json(['message' => 'You can only update homework for your own subjects'], 403);
        }

        $homework->update($validated);

        return response()->json([
            'message' => 'Homework updated successfully',
            'homework' => $homework->load(['class', 'subject', 'teacher']),
        ], 200);
    }

    public function deleteHomework(Request $request, int $id): JsonResponse
    {
        $homework = Homework::find($id);

        if (! $homework) {
            return response()->json(['message' => 'Homework not found'], 404);
        }

        $teacher = Teacher::where('user_id', $request->user()->id)->first();

        if ($request->user()->role !== 'admin' && $homework->assigned_by !== $teacher?->id) {
            return response()->json(['message' => 'You can only delete homework you assigned'], 403);
        }

        $homework->delete();

        return response()->json([
            'message' => 'Homework deleted successfully',
        ], 200);
    }

    public function getHomeworkByStudent(int $studentId): JsonResponse
    {
        $student = Student::find($studentId);

        if (! $student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        $homeworks = Homework::where('class_id', $student->classId)
            ->with(['subject', 'teacher'])
            ->orderBy('due_date', 'desc')
            ->get();

        return response()->json([
            'message' => 'Homework retrieved successfully',
            'homeworks' => $homeworks,
        ], 200);
    }
}
