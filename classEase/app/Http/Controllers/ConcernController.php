<?php

namespace App\Http\Controllers;

use App\Models\Concern;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConcernController extends Controller
{
    public function createConcern(Request $request): JsonResponse
    {
        $student = Student::where('user_id', $request->user()?->id)->first();

        if (! $student) {
            return response()->json(['message' => 'No student profile linked to this account'], 404);
        }

        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $concern = Concern::create([
            ...$validated,
            'student_id' => $student->id,
            'status' => 'open',
        ]);

        return response()->json([
            'message' => 'Concern submitted successfully',
            'concern' => $concern->load(['student:id,firstName,surname']),
        ], 201);
    }

    public function getConcerns(): JsonResponse
    {
        $concerns = Concern::with(['student:id,firstName,surname', 'resolver:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'message' => 'Concerns retrieved successfully',
            'concerns' => $concerns,
        ], 200);
    }

    public function getConcernsByStudent(Request $request, int $studentId): JsonResponse
    {
        $student = Student::find($studentId);

        if (! $student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        if ($this->isStudentForbidden($request, $student)) {
            return response()->json(['message' => 'Not authorized to view this student\'s concerns'], 403);
        }

        $concerns = Concern::where('student_id', $studentId)
            ->with(['student:id,firstName,surname', 'resolver:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'message' => 'Concerns retrieved successfully',
            'concerns' => $concerns,
        ], 200);
    }

    public function getConcern(Request $request, int $id): JsonResponse
    {
        $concern = Concern::with(['student:id,firstName,surname', 'resolver:id,name'])->find($id);

        if (! $concern) {
            return response()->json(['message' => 'Concern not found'], 404);
        }

        if ($this->isStudentForbidden($request, $concern->student)) {
            return response()->json(['message' => 'Not authorized to view this concern'], 403);
        }

        return response()->json([
            'message' => 'Concern retrieved successfully',
            'concern' => $concern,
        ], 200);
    }

    public function updateConcern(Request $request, int $id): JsonResponse
    {
        $concern = Concern::find($id);

        if (! $concern) {
            return response()->json(['message' => 'Concern not found'], 404);
        }

        $validated = $request->validate([
            'status' => 'sometimes|in:open,in_progress,resolved',
            'admin_reply' => 'nullable|string',
        ]);

        if (isset($validated['status'])) {
            $validated['resolved_by'] = $validated['status'] === 'resolved' ? $request->user()?->id : null;
        }

        $concern->update($validated);

        return response()->json([
            'message' => 'Concern updated successfully',
            'concern' => $concern->load(['student:id,firstName,surname', 'resolver:id,name']),
        ], 200);
    }

    public function deleteConcern(int $id): JsonResponse
    {
        $concern = Concern::find($id);

        if (! $concern) {
            return response()->json(['message' => 'Concern not found'], 404);
        }

        $concern->delete();

        return response()->json([
            'message' => 'Concern deleted successfully',
        ], 200);
    }

    private function isStudentForbidden(Request $request, ?Student $student): bool
    {
        $user = $request->user();

        if ($user?->role !== 'student') {
            return false;
        }

        $own = Student::where('user_id', $user->id)->first();

        return $own === null || $student === null || $own->id !== $student->id;
    }
}
