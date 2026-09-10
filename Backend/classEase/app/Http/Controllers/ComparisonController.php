<?php

namespace App\Http\Controllers;

use App\Models\classes;
use App\Models\Score;
use App\Models\Student;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class ComparisonController extends Controller
{
    public function bySubject(Request $request, int $classId, int $subjectId): JsonResponse
    {
        $class = classes::find($classId);
        $subject = Subject::find($subjectId);

        if (! $class) {
            return response()->json(['message' => 'Class not found'], 404);
        }

        if (! $subject) {
            return response()->json(['message' => 'Subject not found'], 404);
        }

        $exam = $request->string('exam')->toString();
        $semester = $request->string('semester', 'current')->toString();
        $ownStudentId = $this->ownStudentId($request);

        $scores = Score::where('class_id', $classId)
            ->where('subject_id', $subjectId)
            ->where('semester', $semester)
            ->when($exam !== '', fn ($query) => $query->where('exam_type', $exam))
            ->with('student:id,firstName,middleName,surname')
            ->get(['id', 'student_id', 'marks_obtained', 'total_marks']);

        $entries = $scores
            ->groupBy('student_id')
            ->map(function (Collection $studentScores) use ($ownStudentId): ?array {
                $student = $studentScores->first()?->student;

                if (! $student) {
                    return null;
                }

                $obtained = (int) $studentScores->sum('marks_obtained');
                $max = (int) $studentScores->sum('total_marks');
                $percentage = $max > 0 ? round(($obtained / $max) * 100, 2) : 0.0;

                return [
                    'student' => [
                        'id' => $student->id,
                        'firstName' => $student->firstName,
                        'middleName' => $student->middleName,
                        'surname' => $student->surname,
                    ],
                    'marks_obtained' => $obtained,
                    'total_marks' => $max,
                    'percentage' => $percentage,
                    'is_you' => $ownStudentId !== null && $student->id === $ownStudentId,
                ];
            })
            ->filter()
            ->values()
            ->sortByDesc('percentage')
            ->values();

        $percentages = $entries->pluck('percentage');

        return response()->json([
            'message' => 'Subject comparison retrieved successfully',
            'class' => ['id' => $class->id, 'class_name' => $class->class_name],
            'subject' => ['id' => $subject->id, 'subjectName' => $subject->subjectName],
            'exam' => $exam !== '' ? $exam : null,
            'semester' => $semester,
            'entries' => $entries->values(),
            'summary' => [
                'class_average' => round((float) $percentages->average(), 2),
                'min' => round((float) $percentages->min(), 2),
                'max' => round((float) $percentages->max(), 2),
            ],
        ], 200);
    }

    public function gaps(Request $request, int $studentId): JsonResponse
    {
        $student = Student::find($studentId);

        if (! $student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        if ($this->isStudentForbidden($request, $student)) {
            return response()->json(['message' => 'Not authorized to view this student\'s comparison'], 403);
        }

        $semester = $request->string('semester', 'current')->toString();

        $subjectIds = Score::where('student_id', $studentId)
            ->where('semester', $semester)
            ->distinct()
            ->pluck('subject_id')
            ->map(fn ($id): int => (int) $id)
            ->all();

        $gaps = [];

        foreach ($subjectIds as $subjectId) {
            $subject = Subject::find($subjectId);

            if (! $subject) {
                continue;
            }

            [$myPercentage, $top3Average, $classAverage] = $this->subjectComparison($student, $subjectId, $semester);

            $gaps[] = [
                'subject' => ['id' => $subject->id, 'subjectName' => $subject->subjectName],
                'my_percentage' => $myPercentage,
                'top3_average' => $top3Average,
                'class_average' => $classAverage,
                'gap_to_top3' => round($top3Average - $myPercentage, 2),
                'gap_to_class' => round($classAverage - $myPercentage, 2),
            ];
        }

        usort($gaps, fn (array $a, array $b): int => $b['gap_to_top3'] <=> $a['gap_to_top3']);

        return response()->json([
            'message' => 'Performance gaps retrieved successfully',
            'semester' => $semester,
            'gaps' => $gaps,
        ], 200);
    }

    public function progress(Request $request, int $studentId): JsonResponse
    {
        $student = Student::find($studentId);

        if (! $student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        if ($this->isStudentForbidden($request, $student)) {
            return response()->json(['message' => 'Not authorized to view this student\'s progress'], 403);
        }

        $subjectIds = Score::where('student_id', $studentId)
            ->distinct()
            ->pluck('subject_id')
            ->map(fn ($id): int => (int) $id)
            ->all();

        $progress = [];

        foreach ($subjectIds as $subjectId) {
            $subject = Subject::find($subjectId);

            if (! $subject) {
                continue;
            }

            $scores = Score::where('student_id', $studentId)
                ->where('subject_id', $subjectId)
                ->orderBy('created_at')
                ->get(['semester', 'marks_obtained', 'total_marks', 'created_at']);

            $current = $this->collectionSemesterPercentage($scores, 'current');
            $previousSemester = $this->previousSemester($studentId, $subjectId);
            $previous = $previousSemester !== null ? $this->collectionSemesterPercentage($scores, $previousSemester) : null;

            if ($current === null && $previous === null) {
                continue;
            }

            $delta = $current !== null && $previous !== null ? round($current - $previous, 2) : null;
            $trend = $delta === null ? 'n/a' : ($delta > 0.5 ? 'up' : ($delta < -0.5 ? 'down' : 'same'));

            $progress[] = [
                'subject' => ['id' => $subject->id, 'subjectName' => $subject->subjectName],
                'current_percentage' => $current,
                'previous_percentage' => $previous,
                'previous_semester' => $previousSemester,
                'delta' => $delta,
                'trend' => $trend,
            ];
        }

        $comparable = array_values(array_filter(
            $progress,
            fn (array $entry): bool => $entry['current_percentage'] !== null && $entry['previous_percentage'] !== null
        ));

        $improved = count(array_filter($progress, fn (array $entry): bool => $entry['trend'] === 'up'));
        $declined = count(array_filter($progress, fn (array $entry): bool => $entry['trend'] === 'down'));
        $overallDelta = count($comparable) > 0
            ? round((array_sum(array_column($comparable, 'current_percentage'))
                - array_sum(array_column($comparable, 'previous_percentage'))) / count($comparable), 2)
            : null;

        return response()->json([
            'message' => 'Progress retrieved successfully',
            'progress' => $progress,
            'summary' => [
                'improved_subjects' => $improved,
                'declined_subjects' => $declined,
                'overall_delta' => $overallDelta,
            ],
        ], 200);
    }

    public function headToHead(Request $request, int $studentAId, int $studentBId): JsonResponse
    {
        $studentA = Student::find($studentAId);
        $studentB = Student::find($studentBId);

        if (! $studentA || ! $studentB) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        if ($this->isStudentForbidden($request, $studentA) && $this->isStudentForbidden($request, $studentB)) {
            return response()->json(['message' => 'Not authorized to view this comparison'], 403);
        }

        if ($request->user()?->role === 'student' && $studentA->classId !== $studentB->classId) {
            return response()->json(['message' => 'Students can only compare with a classmate in the same class'], 403);
        }

        $semester = $request->string('semester', 'current')->toString();

        $aSubjectIds = Score::where('student_id', $studentAId)
            ->where('semester', $semester)
            ->distinct()
            ->pluck('subject_id')
            ->map(fn ($id): int => (int) $id)
            ->all();
        $bSubjectIds = Score::where('student_id', $studentBId)
            ->where('semester', $semester)
            ->distinct()
            ->pluck('subject_id')
            ->map(fn ($id): int => (int) $id)
            ->all();

        $subjectIds = array_values(array_unique(array_merge($aSubjectIds, $bSubjectIds)));

        $results = [];

        foreach ($subjectIds as $subjectId) {
            $subject = Subject::find($subjectId);

            if (! $subject) {
                continue;
            }

            $aPercentage = $this->studentSubjectPercentage($studentAId, $subjectId, $semester);
            $bPercentage = $this->studentSubjectPercentage($studentBId, $subjectId, $semester);

            if ($aPercentage === null && $bPercentage === null) {
                continue;
            }

            $results[] = [
                'subject' => ['id' => $subject->id, 'subjectName' => $subject->subjectName],
                'studentA_percentage' => $aPercentage,
                'studentB_percentage' => $bPercentage,
                'delta' => $aPercentage !== null && $bPercentage !== null
                    ? round($aPercentage - $bPercentage, 2)
                    : null,
                'leader' => $aPercentage !== null && $bPercentage !== null
                    ? ($aPercentage === $bPercentage ? 'tie' : ($aPercentage > $bPercentage ? 'A' : 'B'))
                    : 'n/a',
            ];
        }

        usort($results, fn (array $x, array $y): int => abs($y['delta'] ?? 0) <=> abs($x['delta'] ?? 0));

        $bothScored = array_values(array_filter(
            $results,
            fn (array $entry): bool => $entry['studentA_percentage'] !== null && $entry['studentB_percentage'] !== null
        ));

        $aWin = count(array_filter($bothScored, fn (array $entry): bool => $entry['leader'] === 'A'));
        $bWin = count(array_filter($bothScored, fn (array $entry): bool => $entry['leader'] === 'B'));

        return response()->json([
            'message' => 'Head-to-head comparison retrieved successfully',
            'semester' => $semester,
            'studentA' => ['id' => $studentA->id, 'firstName' => $studentA->firstName, 'middleName' => $studentA->middleName, 'surname' => $studentA->surname],
            'studentB' => ['id' => $studentB->id, 'firstName' => $studentB->firstName, 'middleName' => $studentB->middleName, 'surname' => $studentB->surname],
            'studentA_is_you' => $this->ownStudentId($request) === $studentA->id,
            'studentB_is_you' => $this->ownStudentId($request) === $studentB->id,
            'results' => $results,
            'summary' => [
                'head_to_head_subjects' => count($bothScored),
                'studentA_wins' => $aWin,
                'studentB_wins' => $bWin,
                'ties' => count($bothScored) - $aWin - $bWin,
            ],
        ], 200);
    }

    private function studentSubjectPercentage(int $studentId, int $subjectId, string $semester): ?float
    {
        $scores = Score::where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->where('semester', $semester)
            ->get(['marks_obtained', 'total_marks']);

        if ($scores->isEmpty()) {
            return null;
        }

        $obtained = (int) $scores->sum('marks_obtained');
        $max = (int) $scores->sum('total_marks');

        return $max > 0 ? round(($obtained / $max) * 100, 2) : 0.0;
    }

    /**
     * @return list<float>
     */
    private function subjectComparison(Student $student, int $subjectId, string $semester): array
    {
        $scores = Score::where('class_id', $student->classId)
            ->where('subject_id', $subjectId)
            ->where('semester', $semester)
            ->with('student:id,firstName,middleName,surname')
            ->get(['id', 'student_id', 'marks_obtained', 'total_marks']);

        $percentages = $scores
            ->groupBy('student_id')
            ->map(function (Collection $studentScores): float {
                $obtained = (int) $studentScores->sum('marks_obtained');
                $max = (int) $studentScores->sum('total_marks');

                return $max > 0 ? round(($obtained / $max) * 100, 2) : 0.0;
            });

        $sorted = $percentages->sortDesc()->values();

        $myScores = Score::where('student_id', $student->id)
            ->where('subject_id', $subjectId)
            ->where('semester', $semester)
            ->get(['marks_obtained', 'total_marks']);

        $myObtained = (int) $myScores->sum('marks_obtained');
        $myMax = (int) $myScores->sum('total_marks');
        $myPercentage = $myMax > 0 ? round(($myObtained / $myMax) * 100, 2) : 0.0;

        $top3Average = round((float) $sorted->take(3)->average(), 2);
        $classAverage = round((float) $percentages->average(), 2);

        return [$myPercentage, $top3Average, $classAverage];
    }

    /**
     * @param  Collection<int, Score>  $scores
     */
    private function collectionSemesterPercentage(Collection $scores, string $semester): ?float
    {
        $filtered = $scores->where('semester', $semester);

        if ($filtered->isEmpty()) {
            return null;
        }

        $obtained = (int) $filtered->sum('marks_obtained');
        $max = (int) $filtered->sum('total_marks');

        return $max > 0 ? round(($obtained / $max) * 100, 2) : 0.0;
    }

    private function previousSemester(int $studentId, int $subjectId): ?string
    {
        $latest = Score::where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->where('semester', '!=', 'current')
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->first(['semester']);

        $semester = $latest?->semester;

        return is_string($semester) ? $semester : null;
    }

    private function ownStudentId(Request $request): ?int
    {
        $user = $request->user();

        if ($user === null || $user->role !== 'student') {
            return null;
        }

        $id = Student::where('user_id', $user->id)->value('id');

        return is_int($id) ? $id : null;
    }

    private function isStudentForbidden(Request $request, ?Student $student): bool
    {
        $user = $request->user();

        if ($user?->role !== 'student') {
            return false;
        }

        $ownId = $this->ownStudentId($request);

        return $ownId === null || $student === null || $ownId !== $student->id;
    }
}
