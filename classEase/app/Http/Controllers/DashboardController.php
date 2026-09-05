<?php

namespace App\Http\Controllers;

use App\Models\classes;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Http\JsonResponse;

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
}
