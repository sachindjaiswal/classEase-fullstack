<?php

namespace App\Http\Controllers;

use App\Models\Score;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScoreController extends Controller
{
    public function addScore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'subject_id' => 'required|exists:subjects,id',
            'class_id' => 'required|exists:classes,id',
            'exam_type' => 'required|string|max:255',
            'semester' => 'required|string|max:255',
            'marks_obtained' => 'required|integer|min:0|lte:total_marks',
            'total_marks' => 'required|integer|min:1',
        ]);

        $exists = Score::where('student_id', $validated['student_id'])
            ->where('subject_id', $validated['subject_id'])
            ->where('exam_type', $validated['exam_type'])
            ->where('semester', $validated['semester'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'A score for this student, subject, exam and semester already exists.',
            ], 409);
        }

        $score = Score::create($validated);

        return response()->json([
            'message' => 'Score recorded successfully',
            'score' => $score->load([
                'student:id,firstName,middleName,surname',
                'subject:id,classId,subjectName,teacherId',
                'class:id,class_name,section,room_no',
            ]),
        ], 201);
    }

    public function getScore(int $id): JsonResponse
    {
        $score = Score::with([
            'student:id,firstName,middleName,surname',
            'subject:id,classId,subjectName,teacherId',
            'class:id,class_name,section,room_no',
        ])->find($id);

        if (! $score) {
            return response()->json(['message' => 'Score not found'], 404);
        }

        return response()->json([
            'message' => 'Score retrieved successfully',
            'score' => $score,
        ], 200);
    }

    public function getScoresByClass(int $classId): JsonResponse
    {
        $scores = Score::where('class_id', $classId)
            ->with([
                'student:id,firstName,middleName,surname',
                'subject:id,classId,subjectName,teacherId',
            ])
            ->orderBy('exam_type')
            ->orderBy('subject_id')
            ->get();

        return response()->json([
            'message' => 'Scores retrieved successfully',
            'scores' => $scores,
        ], 200);
    }

    public function getStudentScores(int $studentId): JsonResponse
    {
        $student = Student::find($studentId);

        if (! $student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        $scores = Score::where('student_id', $studentId)
            ->with([
                'subject:id,classId,subjectName,teacherId',
                'class:id,class_name,section,room_no',
            ])
            ->orderBy('exam_type')
            ->orderBy('subject_id')
            ->get();

        return response()->json([
            'message' => 'Scores retrieved successfully',
            'scores' => $scores,
        ], 200);
    }

    public function updateScore(Request $request, int $id): JsonResponse
    {
        $score = Score::find($id);

        if (! $score) {
            return response()->json(['message' => 'Score not found'], 404);
        }

        $validated = $request->validate([
            'student_id' => 'sometimes|exists:students,id',
            'subject_id' => 'sometimes|exists:subjects,id',
            'class_id' => 'sometimes|exists:classes,id',
            'exam_type' => 'sometimes|string|max:255',
            'semester' => 'sometimes|string|max:255',
            'marks_obtained' => 'sometimes|integer|min:0|lte:total_marks',
            'total_marks' => 'sometimes|integer|min:1',
        ]);

        $duplicate = Score::where('student_id', $validated['student_id'] ?? $score->student_id)
            ->where('subject_id', $validated['subject_id'] ?? $score->subject_id)
            ->where('exam_type', $validated['exam_type'] ?? $score->exam_type)
            ->where('semester', $validated['semester'] ?? $score->semester)
            ->where('id', '!=', $score->id)
            ->exists();

        if ($duplicate) {
            return response()->json([
                'message' => 'A score for this student, subject, exam and semester already exists.',
            ], 409);
        }

        $score->update($validated);

        return response()->json([
            'message' => 'Score updated successfully',
            'score' => $score->load([
                'student:id,firstName,middleName,surname',
                'subject:id,classId,subjectName,teacherId',
                'class:id,class_name,section,room_no',
            ]),
        ], 200);
    }

    public function deleteScore(int $id): JsonResponse
    {
        $score = Score::find($id);

        if (! $score) {
            return response()->json(['message' => 'Score not found'], 404);
        }

        $score->delete();

        return response()->json([
            'message' => 'Score deleted successfully',
        ], 200);
    }
}
