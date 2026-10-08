<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\classes;
use App\Models\Homework;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function getStats(): JsonResponse
    {
        return response()->json([
            'teachers' => Teacher::count(),
            'students' => Student::count(),
            'classes' => classes::count(),
            'subjects' => Subject::count(),
        ], 200);
    }

    public function getFeed(Request $request): JsonResponse
    {
        $user = $request->user();
        $role = $user?->role;

        $announcementsQuery = Announcement::with(['class', 'poster:id,name']);
        $homeworksQuery = Homework::with(['class', 'subject', 'teacher:id,first_name,middle_name,surname']);

        if ($role === 'admin') {
            // Admin sees everything.
        } elseif ($role === 'teacher') {
            $teacher = $user->teacher;

            $classIds = collect();
            if ($teacher) {
                $classIds = $teacher->classes()->pluck('id')
                    ->merge($teacher->subjects()->pluck('classId'))
                    ->unique()
                    ->values();
            }

            $announcementsQuery->where(function ($query) use ($classIds) {
                $query->whereNull('class_id');
                if ($classIds->isNotEmpty()) {
                    $query->orWhereIn('class_id', $classIds->toArray());
                }
            });

            $homeworksQuery->where(function ($query) use ($classIds, $teacher) {
                if ($classIds->isNotEmpty()) {
                    $query->whereIn('class_id', $classIds->toArray());
                }
                if ($teacher) {
                    $query->orWhere('assigned_by', $teacher->id);
                }
            });
        } else {
            $student = $user?->student;
            $classId = $student?->classId;

            $announcementsQuery->where(function ($query) use ($classId) {
                $query->whereNull('class_id');
                if (is_numeric($classId)) {
                    $query->orWhere('class_id', $classId);
                }
            });

            $homeworksQuery->where(function ($query) use ($classId) {
                if (is_numeric($classId)) {
                    $query->where('class_id', $classId);
                }
            });
        }

        $announcements = $announcementsQuery->orderBy('created_at', 'desc')->get();
        $homeworks = $homeworksQuery->orderBy('due_date', 'asc')->get();

        return response()->json([
            'message' => 'Dashboard feed retrieved successfully',
            'announcements' => $announcements,
            'homeworks' => $homeworks,
        ], 200);
    }
}
