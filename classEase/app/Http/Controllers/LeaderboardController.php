<?php

namespace App\Http\Controllers;

use App\Models\Classes;
use App\Models\Score;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class LeaderboardController extends Controller
{
    public function getLeaderboardByClass(Request $request, int $classId): JsonResponse
    {
        $class = Classes::find($classId);

        if (! $class) {
            return response()->json(['message' => 'Class not found'], 404);
        }

        $exam = $request->string('exam')->toString();
        $scores = Score::where('class_id', $classId)
            ->when($exam !== '', fn ($query) => $query->where('exam_type', $exam))
            ->with('student:id,firstName,middleName,surname')
            ->get(['id', 'student_id', 'marks_obtained', 'total_marks']);

        $grouped = $scores->groupBy('student_id');

        $leaderboard = $grouped
            ->map(function (Collection $studentScores): ?array {
                $student = $studentScores->first()?->student;

                if (! $student) {
                    return null;
                }

                $obtained = (int) $studentScores->sum('marks_obtained');
                $max = (int) $studentScores->sum('total_marks');

                return [
                    'student' => [
                        'id' => $student->id,
                        'firstName' => $student->firstName,
                        'middleName' => $student->middleName,
                        'surname' => $student->surname,
                    ],
                    'exams_count' => $studentScores->count(),
                    'marks_obtained' => $obtained,
                    'total_marks' => $max,
                    'average_percentage' => $max > 0 ? round(($obtained / $max) * 100, 2) : 0,
                ];
            })
            ->filter()
            ->values()
            ->sortByDesc('average_percentage')
            ->values();

        $rank = 1;
        foreach ($leaderboard as &$entry) {
            $entry['rank'] = $rank++;
        }
        unset($entry);

        return response()->json([
            'message' => 'Leaderboard retrieved successfully',
            'class' => [
                'id' => $class->id,
                'class_name' => $class->class_name,
            ],
            'exam' => $exam !== '' ? $exam : null,
            'leaderboard' => $leaderboard->values(),
        ], 200);
    }
}
