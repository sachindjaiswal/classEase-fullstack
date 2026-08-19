<?php

namespace App\Http\Controllers;

use App\Models\Student;
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

        Student::create($validated);

        return response()->json([
            'message' => 'Student added successfully',
        ]);
    }

    // get Student
    public function getStudent(int $id): JsonResponse
    {

        $student = Student::with('class')->find($id);

        if (! $student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        return response()->json($student);
    }

    public function getAllStudentFromClass(int $id): JsonResponse
    {
        $students = Student::with('class')->where('classId', $id)->get();

        return response()->json($students);
    }
}
