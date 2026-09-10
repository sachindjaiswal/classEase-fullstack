<?php

use App\Models\Announcement;
use App\Models\classes;
use App\Models\Score;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

function classroomTeacher(): array
{
    $user = User::factory()->create(['role' => 'teacher']);
    $teacher = Teacher::create([
        'user_id' => $user->id,
        'first_name' => 'Meera',
        'middle_name' => '',
        'surname' => 'Iyer',
        'email' => 'workflow-teacher@classease.com',
        'contact' => '9123456789',
        'designation' => 'Mathematics',
        'monthly_salary' => 25000,
    ]);

    $class = classes::create([
        'class_name' => 'Grade 10',
        'section' => 'A',
        'room_no' => '101',
    ]);

    $subject = Subject::create([
        'classId' => $class->id,
        'subjectName' => 'Mathematics',
        'teacherId' => $teacher->id,
    ]);

    $studentUser = User::factory()->create(['role' => 'student']);
    $student = Student::create([
        'user_id' => $studentUser->id,
        'classId' => $class->id,
        'firstName' => 'Arjun',
        'middleName' => '',
        'surname' => 'Mehta',
        'email' => 'workflow-student@classease.com',
        'password' => Hash::make('secret123'),
        'contact' => '9000000001',
        'parentContact' => '9000000002',
        'address' => 'Test address',
    ]);

    return [$user, $teacher, $class, $subject, $student];
}

test('a teacher can resolve their own profile via /teacher/me', function () {
    [$user, $teacher] = classroomTeacher();

    Sanctum::actingAs($user);

    $this->getJson('/api/teacher/me')
        ->assertOk()
        ->assertJsonPath('id', $teacher->id)
        ->assertJsonPath('email', $teacher->email);
});

test('a teacher can post an announcement to a class they teach', function () {
    [$user, , $class] = classroomTeacher();

    Sanctum::actingAs($user);

    $this->postJson('/api/announcements', [
        'class_id' => $class->id,
        'title' => 'Unit test on Friday',
        'description' => 'Covers chapters 1-3.',
    ])->assertCreated()
        ->assertJsonPath('announcement.class_id', $class->id)
        ->assertJsonPath('announcement.title', 'Unit test on Friday');

    expect(Announcement::where('title', 'Unit test on Friday')->exists())->toBeTrue();
});

test('a teacher can record a score for a subject they teach', function () {
    [$user, , $class, $subject, $student] = classroomTeacher();

    Sanctum::actingAs($user);

    $this->postJson('/api/scores', [
        'student_id' => $student->id,
        'subject_id' => $subject->id,
        'class_id' => $class->id,
        'exam_type' => 'Unit Test',
        'semester' => 'current',
        'marks_obtained' => 42,
        'total_marks' => 50,
    ])->assertCreated()
        ->assertJsonPath('score.marks_obtained', 42);

    expect(Score::where('student_id', $student->id)->exists())->toBeTrue();
});

test('a teacher can save a timetable for a class they teach', function () {
    [$user, $teacher, $class, $subject] = classroomTeacher();

    Sanctum::actingAs($user);

    $this->postJson('/api/timetable', [
        'class_id' => $class->id,
        'slots' => [
            [
                'day' => 'Monday',
                'period' => '1st',
                'subject_id' => $subject->id,
            ],
        ],
    ])->assertOk();

    $this->getJson("/api/timetable/class/{$class->id}")
        ->assertOk()
        ->assertJsonCount(1, 'timetable')
        ->assertJsonPath('timetable.0.subject_id', $subject->id)
        ->assertJsonPath('timetable.0.teacher_id', $teacher->id);
});
