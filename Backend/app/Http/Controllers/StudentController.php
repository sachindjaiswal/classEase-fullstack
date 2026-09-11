<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

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
            'email' => [
                'required',
                'email',
                Rule::unique('students', 'email')->whereNull('deleted_at'),
                Rule::unique('users', 'email')->whereNull('deleted_at'),
            ],
            'password' => 'required|min:6',
            'contact' => 'required',
            'parentContact' => 'required',
            'address' => 'required|string',
        ]);

        DB::transaction(function () use ($validated) {
            Student::onlyTrashed()->where('email', $validated['email'])->forceDelete();
            User::onlyTrashed()->where('email', $validated['email'])->forceDelete();

            $user = User::create([
                'name' => trim(implode(' ', array_filter([
                    $validated['firstName'],
                    $validated['middleName'] ?? null,
                    $validated['surname'],
                ]))),
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => 'student',
            ]);

            Student::create(array_merge($validated, [
                'user_id' => $user->id,
                'password' => Hash::make($validated['password']),
            ]));
        });

        $student = Student::with('class')->where('email', $validated['email'])->first();

        return response()->json([
            'message' => 'Student added successfully. Their login is the email and password you entered.',
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

    public function getMyStudent(Request $request): JsonResponse
    {
        $student = Student::with('class')->where('user_id', $request->user()?->id)->first();

        if (! $student) {
            return response()->json(['message' => 'No student profile linked to this account'], 404);
        }

        return response()->json([
            'message' => 'Student retrieved successfully',
            'student' => $student,
        ]);
    }

    public function getAllStudentFromClass(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if ($user?->role === 'student') {
            $ownClass = $user->student()->value('classId');

            if (! is_numeric($ownClass) || (int) $ownClass !== (int) $id) {
                return response()->json([
                    'message' => 'Students can only view their own class roster',
                ], 403);
            }
        }

        $students = Student::with('class')->where('classId', $id)->get();

        return response()->json($students);
    }

    public function getStudentSubjects(int $id): JsonResponse
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
            'email' => [
                'sometimes',
                'email',
                Rule::unique('students', 'email')->ignore($id)->whereNull('deleted_at'),
                Rule::unique('users', 'email')->ignore($student->user_id)->whereNull('deleted_at'),
            ],
            'password' => 'sometimes|nullable|min:6',
            'contact' => 'sometimes|string',
            'parentContact' => 'sometimes|string',
            'address' => 'sometimes|string',
        ]);

        $plainPassword = null;

        if (! empty($validated['password'])) {
            $plainPassword = $validated['password'];
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        DB::transaction(function () use ($student, $validated, $plainPassword) {
            $student->update($validated);

            $name = trim(implode(' ', array_filter([
                $validated['firstName'] ?? $student->firstName,
                $validated['middleName'] ?? $student->middleName,
                $validated['surname'] ?? $student->surname,
            ])));

            $email = $validated['email'] ?? $student->email;

            if ($student->user_id) {
                $user = User::find($student->user_id);

                if ($user) {
                    $data = [
                        'name' => $name,
                        'email' => $email,
                    ];

                    if ($plainPassword !== null) {
                        $data['password'] = $plainPassword;
                    }

                    $user->update($data);
                }
            } elseif ($plainPassword !== null) {
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => $plainPassword,
                    'role' => 'student',
                ]);

                $student->update(['user_id' => $user->id]);
            }
        });

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

        $userId = $student->user_id;

        DB::transaction(function () use ($student, $userId) {
            $student->forceDelete();

            if ($userId) {
                User::withoutGlobalScopes()->where('id', $userId)->forceDelete();
            }
        });

        return response()->json([
            'message' => 'Student deleted successfully',
        ]);
    }
}
