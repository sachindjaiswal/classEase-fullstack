<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class StudentController extends Controller
{
    // Add Student
    public function addStudent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'classId' => 'required|exists:classes,id',
            'firstName' => 'required|string|max:255',
            'middleName' => 'nullable|string|max:255',
            'surname' => 'required|string|max:255',
            'email' => 'required|email|unique:students,email',
            'password' => 'required|min:6',
            'contact' => 'required',
            'parentContact' => 'required',
            'address' => 'required|string',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        $student = Student::create($validated);

        return response()->json([
            'message' => 'Student added successfully',
            'student' => $student,
        ], 201);
    }

    // get Student
    public function getStudent(int $id): JsonResponse
    {
        $student = Student::with('class')->find($id);

        if (! $student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        return response()->json([
            'message' => 'Student retrieved successfully',
            'student' => $student,
        ]);
    }

    public function getAllStudentFromClass(int $id): JsonResponse
    {
        $students = Student::with('class')->where('classId', $id)->get();

        return response()->json($students);
    }

    public function getStudentSubjects($id)
    {
        $student = Student::find($id);

        if (! $student) {
            return response()->json([
                'message' => 'Student not found',
            ], 404);
        }

        $subjects = Subject::where('classId', $student->classId)
            ->with('teacher')
            ->get();

        return response()->json([
            'message' => 'Student subjects retrieved successfully',
            'subjects' => $subjects,
        ]);
    }

    public function updateStudent(Request $request, int $id): JsonResponse
    {
        $student = Student::find($id);

        if (! $student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        $validated = $request->validate([
            'classId' => 'sometimes|required|exists:classes,id',
            'firstName' => 'sometimes|string|max:255',
            'middleName' => 'nullable|string|max:255',
            'surname' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:students,email,'.$id,
            'password' => 'sometimes|nullable|min:6',
            'contact' => 'sometimes|string',
            'parentContact' => 'sometimes|string',
            'address' => 'sometimes|string',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $student->update($validated);

        return response()->json([
            'message' => 'Student updated successfully',
            'student' => $student,
        ]);
    }

    public function deleteStudent(int $id): JsonResponse
    {
        $student = Student::find($id);

        if (! $student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        $student->delete();

        return response()->json([
            'message' => 'Student deleted successfully',
        ]);
    }
}
