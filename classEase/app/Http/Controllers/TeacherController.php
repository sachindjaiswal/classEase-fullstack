<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    // Get all teachers
    public function getAllTeachers(): JsonResponse
    {
        return response()->json(Teacher::all(), 200);
    }

    // Get one teacher
    public function getTeacher(int $id): JsonResponse
    {
        $teacher = Teacher::find($id);

        if (! $teacher) {
            return response()->json([
                'message' => 'Teacher not found',
            ], 404);
        }

        return response()->json($teacher, 200);
    }

    // Add teacher
    public function createTeacher(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'surname' => 'required|string|max:255',
            'email' => 'required|email|unique:teachers,email',
            'contact' => 'required|string|max:15',
            'designation' => 'required|string|max:255',
            'monthly_salary' => 'required|integer|min:0',
        ]);

        $teacher = Teacher::create($validated);

        return response()->json([
            'message' => 'Teacher created successfully',
            'teacher' => $teacher,
        ], 201);
    }

    // Update teacher
    public function updateTeacher(Request $request, int $id): JsonResponse
    {
        $teacher = Teacher::find($id);

        if (! $teacher) {
            return response()->json([
                'message' => 'Teacher not found',
            ], 404);
        }

        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'surname' => 'sometimes|string|max:255',
            'email' => "sometimes|email|unique:teachers,email,$id",
            'contact' => 'sometimes|string|max:15',
            'designation' => 'sometimes|string|max:255',
            'monthly_salary' => 'sometimes|integer|min:0',
        ]);

        $teacher->update($validated);

        return response()->json([
            'message' => 'Teacher updated successfully',
            'teacher' => $teacher,
        ], 200);
    }

    // Delete teacher
    public function deleteTeacher(int $id): JsonResponse
    {
        $teacher = Teacher::find($id);

        if (! $teacher) {
            return response()->json([
                'message' => 'Teacher not found',
            ], 404);
        }

        $teacher->delete();

        return response()->json([
            'message' => 'Teacher deleted successfully',
        ], 200);
    }

    public function getTeacherSubjects($id)
    {
        $teacher = Teacher::find($id);

        if (! $teacher) {
            return response()->json([
                'message' => 'Teacher not found',
            ], 404);
        }

        $subjects = Subject::where('teacherId', $id)
            ->with('class')
            ->get();

        return response()->json([
            'message' => 'Teacher subjects retrieved successfully',
            'subjects' => $subjects,
        ]);
    }
}
