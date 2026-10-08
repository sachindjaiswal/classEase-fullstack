<?php

use App\Models\classes;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

function adminUser(): User
{
    return User::factory()->create(['role' => 'admin']);
}

function createClass(): classes
{
    return classes::create([
        'class_name' => 'Grade 10',
        'section' => 'A',
        'room_no' => '101',
    ]);
}

test('admin creating a student also creates a matching login account', function () {
    $class = createClass();
    $admin = adminUser();

    Sanctum::actingAs($admin);

    $this->postJson('/api/students', [
        'classId' => $class->id,
        'firstName' => 'Rahul',
        'middleName' => 'K',
        'surname' => 'Sharma',
        'email' => 'rahul@classease.com',
        'password' => 'secret123',
        'contact' => '9876543210',
        'parentContact' => '9876543211',
        'address' => 'Test address',
    ])->assertCreated();

    $user = User::where('email', 'rahul@classease.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->role)->toBe('student')
        ->and($user->name)->toBe('Rahul K Sharma');

    $student = Student::where('email', 'rahul@classease.com')->first();
    expect($student->user_id)->toBe($user->id);

    $this->postJson('/api/login', [
        'email' => 'rahul@classease.com',
        'password' => 'secret123',
    ])->assertOk()
        ->assertJsonPath('user.role', 'student');
});

test('admin creating a teacher also creates a matching login account', function () {
    $admin = adminUser();

    Sanctum::actingAs($admin);

    $this->postJson('/api/teachers', [
        'first_name' => 'Meera',
        'middle_name' => '',
        'surname' => 'Iyer',
        'email' => 'meera@classease.com',
        'password' => 'teacherpass',
        'contact' => '9123456789',
        'designation' => 'Mathematics',
        'monthly_salary' => 25000,
    ])->assertCreated();

    $user = User::where('email', 'meera@classease.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->role)->toBe('teacher')
        ->and($user->name)->toBe('Meera Iyer');

    $teacher = Teacher::where('email', 'meera@classease.com')->first();
    expect($teacher->user_id)->toBe($user->id);

    $this->postJson('/api/login', [
        'email' => 'meera@classease.com',
        'password' => 'teacherpass',
    ])->assertOk()
        ->assertJsonPath('user.role', 'teacher');
});

test('updating a student password keeps their login in sync', function () {
    $class = createClass();
    $admin = adminUser();

    Sanctum::actingAs($admin);

    $this->postJson('/api/students', [
        'classId' => $class->id,
        'firstName' => 'Rahul',
        'middleName' => '',
        'surname' => 'Sharma',
        'email' => 'rahul@classease.com',
        'password' => 'secret123',
        'contact' => '9876543210',
        'parentContact' => '9876543211',
        'address' => 'Test address',
    ])->assertCreated();

    $student = Student::where('email', 'rahul@classease.com')->first();

    Sanctum::actingAs($admin);
    $this->putJson("/api/student/{$student->id}", [
        'password' => 'newpass456',
    ])->assertOk();

    $this->postJson('/api/login', [
        'email' => 'rahul@classease.com',
        'password' => 'secret123',
    ])->assertStatus(422);

    $this->postJson('/api/login', [
        'email' => 'rahul@classease.com',
        'password' => 'newpass456',
    ])->assertOk();
});

test('editing a student email also updates the login email', function () {
    $class = createClass();
    $admin = adminUser();

    Sanctum::actingAs($admin);

    $this->postJson('/api/students', [
        'classId' => $class->id,
        'firstName' => 'Rahul',
        'middleName' => '',
        'surname' => 'Sharma',
        'email' => 'rahul@classease.com',
        'password' => 'secret123',
        'contact' => '9876543210',
        'parentContact' => '9876543211',
        'address' => 'Test address',
    ])->assertCreated();

    $student = Student::where('email', 'rahul@classease.com')->first();

    Sanctum::actingAs($admin);
    $this->putJson("/api/student/{$student->id}", [
        'email' => 'rahul.new@classease.com',
    ])->assertOk();

    expect(User::where('email', 'rahul.new@classease.com')->exists())->toBeTrue();

    $this->postJson('/api/login', [
        'email' => 'rahul.new@classease.com',
        'password' => 'secret123',
    ])->assertOk();
});

test('a student email cannot collide with an existing login account', function () {
    $class = createClass();
    $admin = adminUser();

    User::factory()->create([
        'email' => 'taken@classease.com',
        'role' => 'student',
    ]);

    Sanctum::actingAs($admin);

    $this->postJson('/api/students', [
        'classId' => $class->id,
        'firstName' => 'Rahul',
        'middleName' => '',
        'surname' => 'Sharma',
        'email' => 'taken@classease.com',
        'password' => 'secret123',
        'contact' => '9876543210',
        'parentContact' => '9876543211',
        'address' => 'Test address',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('deleting a student revokes their login', function () {
    $class = createClass();
    $admin = adminUser();

    Sanctum::actingAs($admin);

    $this->postJson('/api/students', [
        'classId' => $class->id,
        'firstName' => 'Rahul',
        'middleName' => '',
        'surname' => 'Sharma',
        'email' => 'rahul@classease.com',
        'password' => 'secret123',
        'contact' => '9876543210',
        'parentContact' => '9876543211',
        'address' => 'Test address',
    ])->assertCreated();

    $student = Student::where('email', 'rahul@classease.com')->first();

    Sanctum::actingAs($admin);
    $this->deleteJson("/api/student/{$student->id}")->assertOk();

    $this->postJson('/api/login', [
        'email' => 'rahul@classease.com',
        'password' => 'secret123',
    ])->assertStatus(422);
});

test('public registration can never create an admin account', function () {
    $this->postJson('/api/register', [
        'name' => 'Sneaky',
        'email' => 'sneaky@example.com',
        'password' => 'secret123',
        'password_confirmation' => 'secret123',
    ])->assertCreated();

    expect(User::where('email', 'sneaky@example.com')->value('role'))->toBe('student');
});

test('a deleted teacher email can be reused for a new teacher', function () {
    $admin = adminUser();

    Sanctum::actingAs($admin);

    $this->postJson('/api/teachers', [
        'first_name' => 'Meera',
        'middle_name' => '',
        'surname' => 'Iyer',
        'email' => 'reuse-teacher@classease.com',
        'password' => 'teacherpass',
        'contact' => '9123456789',
        'designation' => 'Mathematics',
        'monthly_salary' => 25000,
    ])->assertCreated();

    $teacher = Teacher::where('email', 'reuse-teacher@classease.com')->first();

    $this->deleteJson("/api/teachers/{$teacher->id}")->assertOk();

    $this->postJson('/api/teachers', [
        'first_name' => 'Ravi',
        'middle_name' => '',
        'surname' => 'Nair',
        'email' => 'reuse-teacher@classease.com',
        'password' => 'newpass456',
        'contact' => '9123456790',
        'designation' => 'Physics',
        'monthly_salary' => 30000,
    ])->assertCreated();

    expect(User::where('email', 'reuse-teacher@classease.com')->count())->toBe(1);

    $this->postJson('/api/login', [
        'email' => 'reuse-teacher@classease.com',
        'password' => 'newpass456',
    ])->assertOk()
        ->assertJsonPath('user.role', 'teacher');
});

test('a deleted student email can be reused for a new student', function () {
    $class = createClass();
    $admin = adminUser();

    Sanctum::actingAs($admin);

    $this->postJson('/api/students', [
        'classId' => $class->id,
        'firstName' => 'Rahul',
        'middleName' => '',
        'surname' => 'Sharma',
        'email' => 'reuse-student@classease.com',
        'password' => 'secret123',
        'contact' => '9876543210',
        'parentContact' => '9876543211',
        'address' => 'Test address',
    ])->assertCreated();

    $student = Student::where('email', 'reuse-student@classease.com')->first();

    $this->deleteJson("/api/student/{$student->id}")->assertOk();

    $this->postJson('/api/students', [
        'classId' => $class->id,
        'firstName' => 'Priya',
        'middleName' => '',
        'surname' => 'Kapoor',
        'email' => 'reuse-student@classease.com',
        'password' => 'secret456',
        'contact' => '9876543212',
        'parentContact' => '9876543213',
        'address' => 'Test address',
    ])->assertCreated();

    expect(User::where('email', 'reuse-student@classease.com')->count())->toBe(1);
});
