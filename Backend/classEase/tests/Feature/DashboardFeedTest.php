<?php

use App\Models\Announcement;
use App\Models\classes;
use App\Models\Homework;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

function feedClass(string $name): classes
{
    return classes::create([
        'class_name' => $name,
        'section' => 'A',
        'room_no' => '101',
    ]);
}

function feedTeacherProfile(): Teacher
{
    $user = User::factory()->create(['role' => 'teacher']);
    $teacher = Teacher::create([
        'user_id' => $user->id,
        'first_name' => 'Meera',
        'middle_name' => '',
        'surname' => 'Iyer',
        'email' => 'feed-teacher@classease.com',
        'contact' => '9123456789',
        'designation' => 'Mathematics',
        'monthly_salary' => 25000,
    ]);

    return $teacher;
}

function feedStudentProfile(int $classId): Student
{
    $user = User::factory()->create(['role' => 'student']);
    $student = Student::create([
        'user_id' => $user->id,
        'classId' => $classId,
        'firstName' => 'Arjun',
        'middleName' => '',
        'surname' => 'Mehta',
        'email' => "feed-{$classId}@classease.com",
        'password' => Hash::make('secret123'),
        'contact' => '9000000001',
        'parentContact' => '9000000002',
        'address' => 'Test address',
    ]);

    return $student;
}

test('admin dashboard feed includes every announcement and homework', function () {
    $class1 = feedClass('Grade 10');
    $teacher = feedTeacherProfile();
    $subject = Subject::create([
        'classId' => $class1->id,
        'subjectName' => 'Mathematics',
        'teacherId' => $teacher->id,
    ]);

    Announcement::create(['class_id' => null, 'title' => 'Holiday notice']);
    Announcement::create(['class_id' => $class1->id, 'title' => 'Class trip']);
    Homework::create([
        'class_id' => $class1->id,
        'subject_id' => $subject->id,
        'assigned_by' => $teacher->id,
        'title' => 'Algebra worksheet',
        'assigned_date' => '2026-09-01',
        'due_date' => '2026-09-10',
    ]);

    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $this->getJson('/api/dashboard/feed')
        ->assertOk()
        ->assertJsonCount(2, 'announcements')
        ->assertJsonCount(1, 'homeworks');
});

test('student dashboard feed shows only their class and general notices', function () {
    $class1 = feedClass('Grade 10');
    $class2 = feedClass('Grade 11');
    $teacher = feedTeacherProfile();
    $subject1 = Subject::create([
        'classId' => $class1->id,
        'subjectName' => 'Mathematics',
        'teacherId' => $teacher->id,
    ]);
    $subject2 = Subject::create([
        'classId' => $class2->id,
        'subjectName' => 'Physics',
        'teacherId' => $teacher->id,
    ]);

    Announcement::create(['class_id' => null, 'title' => 'Holiday notice']);
    Announcement::create(['class_id' => $class1->id, 'title' => 'Class 1 news']);
    Announcement::create(['class_id' => $class2->id, 'title' => 'Class 2 secret']);
    Homework::create([
        'class_id' => $class1->id,
        'subject_id' => $subject1->id,
        'assigned_by' => $teacher->id,
        'title' => 'Algebra worksheet',
        'assigned_date' => '2026-09-01',
        'due_date' => '2026-09-10',
    ]);
    Homework::create([
        'class_id' => $class2->id,
        'subject_id' => $subject2->id,
        'assigned_by' => $teacher->id,
        'title' => 'Physics lab',
        'assigned_date' => '2026-09-01',
        'due_date' => '2026-09-12',
    ]);

    $student = feedStudentProfile($class1->id);

    Sanctum::actingAs(User::find($student->user_id));

    $this->getJson('/api/dashboard/feed')
        ->assertOk()
        ->assertJsonCount(2, 'announcements')
        ->assertJsonPath('announcements.1.title', 'Class 1 news')
        ->assertJsonCount(1, 'homeworks')
        ->assertJsonPath('homeworks.0.title', 'Algebra worksheet');
});
