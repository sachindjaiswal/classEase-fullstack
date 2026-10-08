<?php

use App\Models\classes;
use App\Models\Score;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

function leaderboardClass(): array
{
    $class = classes::create([
        'class_name' => 'Grade 11',
        'section' => 'B',
        'room_no' => '201',
    ]);

    $subject = Subject::create([
        'classId' => $class->id,
        'subjectName' => 'Physics',
        'teacherId' => null,
    ]);

    $students = [];
    foreach ([
        ['Priya', 'Sharma', 'leaderboard-priya@classease.com'],
        ['Rohan', 'Verma', 'leaderboard-rohan@classease.com'],
    ] as [$first, $surname, $email]) {
        $user = User::factory()->create(['role' => 'student']);
        $students[] = Student::create([
            'user_id' => $user->id,
            'classId' => $class->id,
            'firstName' => $first,
            'middleName' => '',
            'surname' => $surname,
            'email' => $email,
            'password' => Hash::make('secret123'),
            'contact' => '9000000001',
            'parentContact' => '9000000002',
            'address' => 'Test address',
        ]);
    }

    return [$class, $subject, $students];
}

test('leaderboard ranks students by average percentage with correct positions', function () {
    [$class, $subject, $students] = leaderboardClass();

    Score::create([
        'student_id' => $students[0]->id,
        'subject_id' => $subject->id,
        'class_id' => $class->id,
        'exam_type' => 'Final Exam',
        'semester' => 'current',
        'marks_obtained' => 90,
        'total_marks' => 100,
    ]);
    Score::create([
        'student_id' => $students[1]->id,
        'subject_id' => $subject->id,
        'class_id' => $class->id,
        'exam_type' => 'Final Exam',
        'semester' => 'current',
        'marks_obtained' => 60,
        'total_marks' => 100,
    ]);

    $tokenUser = User::factory()->create(['role' => 'student']);
    Sanctum::actingAs($tokenUser);

    $this->getJson("/api/leaderboard/class/{$class->id}?semester=current")
        ->assertOk()
        ->assertJsonCount(2, 'leaderboard')
        ->assertJsonPath('leaderboard.0.student.id', $students[0]->id)
        ->assertJsonPath('leaderboard.0.rank', 1)
        ->assertJsonPath('leaderboard.0.average_percentage', 90)
        ->assertJsonPath('leaderboard.1.student.id', $students[1]->id)
        ->assertJsonPath('leaderboard.1.rank', 2)
        ->assertJsonPath('leaderboard.1.average_percentage', 60);
});

test('leaderboard omits students without scores for the selected semester', function () {
    [$class, $subject, $students] = leaderboardClass();

    Score::create([
        'student_id' => $students[1]->id,
        'subject_id' => $subject->id,
        'class_id' => $class->id,
        'exam_type' => 'Final Exam',
        'semester' => 'current',
        'marks_obtained' => 50,
        'total_marks' => 100,
    ]);

    $tokenUser = User::factory()->create(['role' => 'student']);
    Sanctum::actingAs($tokenUser);

    $this->getJson("/api/leaderboard/class/{$class->id}?semester=current")
        ->assertOk()
        ->assertJsonCount(1, 'leaderboard')
        ->assertJsonPath('leaderboard.0.student.id', $students[1]->id)
        ->assertJsonPath('leaderboard.0.rank', 1);
});
