<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function createAnnouncement(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'class_id' => 'nullable|exists:classes,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $announcement = Announcement::create([
            ...$validated,
            'posted_by' => $request->user()?->id,
        ]);

        return response()->json([
            'message' => 'Announcement created successfully',
            'announcement' => $announcement->load(['class', 'poster:id,name']),
        ], 201);
    }

    public function getAnnouncements(): JsonResponse
    {
        $announcements = Announcement::with(['class', 'poster:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'message' => 'Announcements retrieved successfully',
            'announcements' => $announcements,
        ], 200);
    }

    public function getAnnouncementsByClass(int $classId): JsonResponse
    {
        $announcements = Announcement::where(function ($query) use ($classId) {
            $query->where('class_id', $classId)
                ->orWhereNull('class_id');
        })
            ->with(['class', 'poster:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'message' => 'Announcements retrieved successfully',
            'announcements' => $announcements,
        ], 200);
    }

    public function getAnnouncement(int $id): JsonResponse
    {
        $announcement = Announcement::with(['class', 'poster:id,name'])->find($id);

        if (! $announcement) {
            return response()->json(['message' => 'Announcement not found'], 404);
        }

        return response()->json([
            'message' => 'Announcement retrieved successfully',
            'announcement' => $announcement,
        ], 200);
    }

    public function updateAnnouncement(Request $request, int $id): JsonResponse
    {
        $announcement = Announcement::find($id);

        if (! $announcement) {
            return response()->json(['message' => 'Announcement not found'], 404);
        }

        $validated = $request->validate([
            'class_id' => 'nullable|exists:classes,id',
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
        ]);

        $announcement->update($validated);

        return response()->json([
            'message' => 'Announcement updated successfully',
            'announcement' => $announcement->load(['class', 'poster:id,name']),
        ], 200);
    }

    public function deleteAnnouncement(int $id): JsonResponse
    {
        $announcement = Announcement::find($id);

        if (! $announcement) {
            return response()->json(['message' => 'Announcement not found'], 404);
        }

        $announcement->delete();

        return response()->json([
            'message' => 'Announcement deleted successfully',
        ], 200);
    }

    public function getAnnouncementsByStudent(int $studentId): JsonResponse
    {
        $student = Student::find($studentId);

        if (! $student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        $announcements = Announcement::where(function ($query) use ($student) {
            $query->where('class_id', $student->classId)
                ->orWhereNull('class_id');
        })
            ->with(['class', 'poster:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'message' => 'Announcements retrieved successfully',
            'announcements' => $announcements,
        ], 200);
    }
}
