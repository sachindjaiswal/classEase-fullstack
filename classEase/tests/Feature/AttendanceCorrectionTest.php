<?php

use App\Models\Attendance;
use App\Models\AttendanceCorrection;
use App\Models\classes;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

function correctionFixture(): array
{
    $adminUser = User::factory()->create(['role' => 'admin']);

    $teacherUser = User::factory()->create(['role' => 'teacher']);
    $teacher = Teacher::create([
        'user_id' => $teacherUser->id,
        'first_name' => 'Meera',
        'middle_name' => '',
        'surname' => 'Iyer',
        'email' => 'correction-teacher@classease.com',
        'contact' => '9123456789',
        'designation' => 'Mathematics',
        'monthly_salary' => 25000,
    ]);

    $otherTeacherUser = User::factory()->create(['role' => 'teacher']);
    $otherTeacher = Teacher::create([
        'user_id' => $otherTeacherUser->id,
        'first_name' => 'Rohan',
        'middle_name' => '',
        'surname' => 'Desai',
        'email' => 'correction-teacher2@classease.com',
        'contact' => '9123456790',
        'designation' => 'Physics',
        'monthly_salary' => 24000,
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
        'email' => 'correction-student@classease.com',
        'password' => Hash::make('secret123'),
        'contact' => '9000000001',
        'parentContact' => '9000000002',
        'address' => 'Test address',
    ]);

    $otherStudentUser = User::factory()->create(['role' => 'student']);
    $otherStudent = Student::create([
        'user_id' => $otherStudentUser->id,
        'classId' => $class->id,
        'firstName' => 'Nikita',
        'middleName' => '',
        'surname' => 'Patel',
        'email' => 'correction-student2@classease.com',
        'password' => Hash::make('secret123'),
        'contact' => '9000000003',
        'parentContact' => '9000000004',
        'address' => 'Test address',
    ]);

    $attendance = Attendance::create([
        'student_id' => $student->id,
        'class_id' => $class->id,
        'date' => '2026-10-01',
        'status' => 'absent',
        'marked_by' => $teacher->id,
        'remarks' => null,
    ]);

    return [
        $adminUser,
        $teacherUser,
        $teacher,
        $otherTeacherUser,
        $otherTeacher,
        $class,
        $subject,
        $studentUser,
        $student,
        $otherStudentUser,
        $otherStudent,
        $attendance,
    ];
}

test('a student can appeal their own attendance record', function () {
    [$adminUser, $teacherUser, $teacher, $otherTeacherUser, $otherTeacher, $class, $subject, $studentUser, $student, $otherStudentUser, $otherStudent, $attendance] = correctionFixture();

    Sanctum::actingAs($studentUser);

    $this->postJson('/api/attendance-corrections', [
        'attendance_id' => $attendance->id,
        'requested_status' => 'present',
        'message' => 'I was present in class that day.',
    ])->assertCreated()
        ->assertJsonPath('correction.previous_status', 'absent')
        ->assertJsonPath('correction.requested_status', 'present')
        ->assertJsonPath('correction.status', 'pending');

    expect(AttendanceCorrection::where('attendance_id', $attendance->id)->exists())->toBeTrue();
});

test('a student cannot appeal another student\'s attendance record', function () {
    [$adminUser, $teacherUser, $teacher, $otherTeacherUser, $otherTeacher, $class, $subject, $studentUser, $student, $otherStudentUser, $otherStudent, $attendance] = correctionFixture();

    Sanctum::actingAs($otherStudentUser);

    $this->postJson('/api/attendance-corrections', [
        'attendance_id' => $attendance->id,
        'requested_status' => 'present',
        'message' => 'Trying to fix someone else record.',
    ])->assertForbidden();
});

test('a duplicate pending appeal for the same record is rejected', function () {
    [$adminUser, $teacherUser, $teacher, $otherTeacherUser, $otherTeacher, $class, $subject, $studentUser, $student, $otherStudentUser, $otherStudent, $attendance] = correctionFixture();

    AttendanceCorrection::create([
        'attendance_id' => $attendance->id,
        'student_id' => $student->id,
        'previous_status' => 'absent',
        'requested_status' => 'present',
        'message' => 'First appeal',
        'status' => 'pending',
    ]);

    Sanctum::actingAs($studentUser);

    $this->postJson('/api/attendance-corrections', [
        'attendance_id' => $attendance->id,
        'requested_status' => 'late',
        'message' => 'Second appeal.',
    ])->assertStatus(400);

    expect(AttendanceCorrection::count())->toBe(1);
});

test('a teacher only sees appeals for attendance records they marked', function () {
    [$adminUser, $teacherUser, $teacher, $otherTeacherUser, $otherTeacher, $class, $subject, $studentUser, $student, $otherStudentUser, $otherStudent, $attendance] = correctionFixture();

    AttendanceCorrection::create([
        'attendance_id' => $attendance->id,
        'student_id' => $student->id,
        'previous_status' => 'absent',
        'requested_status' => 'present',
        'message' => 'I was present.',
        'status' => 'pending',
    ]);

    Sanctum::actingAs($otherTeacherUser);

    $this->getJson('/api/attendance-corrections')
        ->assertOk()
        ->assertJsonCount(0, 'corrections');

    Sanctum::actingAs($teacherUser);

    $this->getJson('/api/attendance-corrections')
        ->assertOk()
        ->assertJsonCount(1, 'corrections')
        ->assertJsonPath('corrections.0.requested_status', 'present');
});

test('the marking teacher can approve an appeal and the record is updated', function () {
    [$adminUser, $teacherUser, $teacher, $otherTeacherUser, $otherTeacher, $class, $subject, $studentUser, $student, $otherStudentUser, $otherStudent, $attendance] = correctionFixture();

    $correction = AttendanceCorrection::create([
        'attendance_id' => $attendance->id,
        'student_id' => $student->id,
        'previous_status' => 'absent',
        'requested_status' => 'present',
        'message' => 'I was present.',
        'status' => 'pending',
    ]);

    Sanctum::actingAs($teacherUser);

    $this->putJson("/api/attendance-corrections/{$correction->id}", [
        'decision' => 'approved',
        'response_reason' => 'Confirmed with the class register.',
    ])->assertOk()
        ->assertJsonPath('correction.status', 'approved');

    expect($attendance->fresh()->status)->toBe('present');
});

test('a teacher cannot handle an appeal for a record they did not mark', function () {
    [$adminUser, $teacherUser, $teacher, $otherTeacherUser, $otherTeacher, $class, $subject, $studentUser, $student, $otherStudentUser, $otherStudent, $attendance] = correctionFixture();

    $correction = AttendanceCorrection::create([
        'attendance_id' => $attendance->id,
        'student_id' => $student->id,
        'previous_status' => 'absent',
        'requested_status' => 'present',
        'message' => 'I was present.',
        'status' => 'pending',
    ]);

    Sanctum::actingAs($otherTeacherUser);

    $this->putJson("/api/attendance-corrections/{$correction->id}", [
        'decision' => 'rejected',
    ])->assertForbidden();

    expect($correction->fresh()->status)->toBe('pending');
});

test('an admin can see every appeal and reject one', function () {
    [$adminUser, $teacherUser, $teacher, $otherTeacherUser, $otherTeacher, $class, $subject, $studentUser, $student, $otherStudentUser, $otherStudent, $attendance] = correctionFixture();

    $correction = AttendanceCorrection::create([
        'attendance_id' => $attendance->id,
        'student_id' => $student->id,
        'previous_status' => 'absent',
        'requested_status' => 'present',
        'message' => 'I was present.',
        'status' => 'pending',
    ]);

    Sanctum::actingAs($adminUser);

    $this->getJson('/api/attendance-corrections')
        ->assertOk()
        ->assertJsonCount(1, 'corrections');

    $this->putJson("/api/attendance-corrections/{$correction->id}", [
        'decision' => 'rejected',
        'response_reason' => 'No record of you in attendance.',
    ])->assertOk()
        ->assertJsonPath('correction.status', 'rejected');

    expect($attendance->fresh()->status)->toBe('absent');
});

test('a teacher can mark attendance for a class they teach', function () {
    [$adminUser, $teacherUser, $teacher, $otherTeacherUser, $otherTeacher, $class, $subject, $studentUser, $student, $otherStudentUser, $otherStudent, $attendance] = correctionFixture();

    Sanctum::actingAs($teacherUser);

    $this->postJson('/api/attendance', [
        'class_id' => $class->id,
        'date' => '2026-10-02',
        'attendances' => [
            ['student_id' => $student->id, 'status' => 'present'],
        ],
    ])->assertOk()
        ->assertJsonPath('message', 'Attendance marked successfully');
});

test('a teacher cannot mark attendance for a class they do not teach', function () {
    [$adminUser, $teacherUser, $teacher, $otherTeacherUser, $otherTeacher, $class, $subject, $studentUser, $student, $otherStudentUser, $otherStudent, $attendance] = correctionFixture();

    Sanctum::actingAs($otherTeacherUser);

    $this->postJson('/api/attendance', [
        'class_id' => $class->id,
        'date' => '2026-10-02',
        'attendances' => [
            ['student_id' => $student->id, 'status' => 'present'],
        ],
    ])->assertForbidden();
});

test('a student cannot read another student\'s attendance', function () {
    [$adminUser, $teacherUser, $teacher, $otherTeacherUser, $otherTeacher, $class, $subject, $studentUser, $student, $otherStudentUser, $otherStudent, $attendance] = correctionFixture();

    Sanctum::actingAs($otherStudentUser);

    $this->getJson("/api/attendance/student/{$student->id}")
        ->assertForbidden();

    Sanctum::actingAs($studentUser);

    $this->getJson("/api/attendance/student/{$student->id}")
        ->assertOk()
        ->assertJsonPath('student.id', $student->id);
});
