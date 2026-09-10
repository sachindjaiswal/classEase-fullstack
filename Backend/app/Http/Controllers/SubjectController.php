<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    // Get all subjects
    public function getAllSubjects(): JsonResponse
    {
        $subjects = Subject::with([
            'class',
            'teacher',
        ])->get();

        return response()->json([
            'message' => 'Subjects retrieved successfully',
            'subjects' => $subjects,
        ]);
    }

    // Get all subjects for a class
    public function getSubjectsByClass(int $classId): JsonResponse
    {
        $subjects = Subject::with([
            'class',
            'teacher',
        ])->where('classId', $classId)
            ->get();

        return response()->json([
            'message' => 'Subjects retrieved successfully',
            'subjects' => $subjects,
        ], 200);
    }

    // Get one subject
    public function getSubject(int $id): JsonResponse
    {
        $subject = Subject::with([
            'class',
            'teacher',
        ])->find($id);

        if (! $subject) {
            return response()->json([
                'message' => 'Subject not found',
            ], 404);
        }

        return response()->json([
            'message' => 'Subject retrieved successfully',
            'subject' => $subject,
        ]);
    }

    // Create subject
    public function createSubject(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'classId' => ['required', 'exists:classes,id'],
            'subjectName' => ['required', 'string', 'max:255'],
            'teacherId' => ['required', 'exists:teachers,id'],
        ]);

        $subject = Subject::create($validated);

        $subject->load([
            'class',
            'teacher',
        ]);

        return response()->json([
            'message' => 'Subject created successfully',
            'subject' => $subject,
        ], 201);
    }

    // Update subject
    public function updateSubject(Request $request, int $id): JsonResponse
    {
        $subject = Subject::find($id);

        if (! $subject) {
            return response()->json([
                'message' => 'Subject not found',
            ], 404);
        }

        $validated = $request->validate([
            'classId' => ['sometimes', 'exists:classes,id'],
            'subjectName' => ['sometimes', 'string', 'max:255'],
            'teacherId' => ['sometimes', 'exists:teachers,id'],
        ]);

        $subject->update($validated);

        $subject->load([
            'class',
            'teacher',
        ]);

        return response()->json([
            'message' => 'Subject updated successfully',
            'subject' => $subject,
        ]);
    }

    // Delete subject
    public function deleteSubject(int $id): JsonResponse
    {
        $subject = Subject::find($id);

        if (! $subject) {
            return response()->json([
                'message' => 'Subject not found',
            ], 404);
        }

        $subject->delete();

        return response()->json([
            'message' => 'Subject deleted successfully',
        ]);
    }
}
