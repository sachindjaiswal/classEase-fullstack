<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

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

    // Get the authenticated user's own teacher profile
    public function getTeacherMe(Request $request): JsonResponse
    {
        $teacher = $request->user()?->teacher;

        if (! $teacher) {
            return response()->json([
                'message' => 'No teacher profile for this account',
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
            'email' => [
                'required',
                'email',
                Rule::unique('teachers', 'email')->whereNull('deleted_at'),
                Rule::unique('users', 'email')->whereNull('deleted_at'),
            ],
            'password' => 'required|string|min:6',
            'contact' => 'required|string|max:15',
            'designation' => 'required|string|max:255',
            'monthly_salary' => 'required|integer|min:0',
        ]);

        DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => trim(implode(' ', array_filter([
                    $validated['first_name'],
                    $validated['middle_name'] ?? null,
                    $validated['surname'],
                ]))),
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => 'teacher',
            ]);

            Teacher::create(array_merge($validated, [
                'user_id' => $user->id,
            ]));
        });

        $teacher = Teacher::where('email', $validated['email'])->first();

        return response()->json([
            'message' => 'Teacher created successfully. Their login is the email and password you entered.',
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
            'email' => [
                'sometimes',
                'email',
                Rule::unique('teachers', 'email')->ignore($id)->whereNull('deleted_at'),
                Rule::unique('users', 'email')->ignore($teacher->user_id)->whereNull('deleted_at'),
            ],
            'password' => 'sometimes|nullable|min:6',
            'contact' => 'sometimes|string|max:15',
            'designation' => 'sometimes|string|max:255',
            'monthly_salary' => 'sometimes|integer|min:0',
        ]);

        $plainPassword = null;

        if (isset($validated['password'])) {
            if (! empty($validated['password'])) {
                $plainPassword = $validated['password'];
            }
            unset($validated['password']);
        }

        DB::transaction(function () use ($teacher, $validated, $plainPassword) {
            $teacher->update($validated);

            $name = trim(implode(' ', array_filter([
                $validated['first_name'] ?? $teacher->first_name,
                $validated['middle_name'] ?? $teacher->middle_name,
                $validated['surname'] ?? $teacher->surname,
            ])));

            $email = $validated['email'] ?? $teacher->email;

            if ($teacher->user_id) {
                $user = User::find($teacher->user_id);

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
                    'role' => 'teacher',
                ]);

                $teacher->update(['user_id' => $user->id]);
            }
        });

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

        $teacher->user?->forceDelete();

        $teacher->delete();

        return response()->json([
            'message' => 'Teacher deleted successfully',
        ], 200);
    }

    public function getTeacherSubjects(int $id): JsonResponse
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
