<?php

namespace App\Http\Controllers;

use App\Models\Homework;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HomeworkController extends Controller
{
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

        $validated = $request->validate([
            'class_id' => 'sometimes|exists:classes,id',
            'subject_id' => 'sometimes|exists:subjects,id',
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'assigned_date' => 'sometimes|date',
            'due_date' => 'sometimes|date',
        ]);

        $homework->update($validated);

        return response()->json([
            'message' => 'Homework updated successfully',
            'homework' => $homework->load(['class', 'subject', 'teacher']),
        ], 200);
    }

    public function deleteHomework(int $id): JsonResponse
    {
        $homework = Homework::find($id);

        if (! $homework) {
            return response()->json(['message' => 'Homework not found'], 404);
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
