<?php

use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClassesController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeworkController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\ScoreController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TeacherController;
use Illuminate\Support\Facades\Route;

// ====================
// Authentication
// ====================

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// ====================
// Protected Routes
// ====================

Route::middleware('auth:sanctum')->group(function () {

    // Authentication
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // ====================
    // Dashboard
    // ====================

    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);

    // ====================
    // Classes
    // ====================

    Route::get('/classes', [ClassesController::class, 'getAllClasses']);
    Route::get('/classes/{id}', [ClassesController::class, 'getClass']);
    Route::post('/classes', [ClassesController::class, 'createClass']);
    Route::put('/classes/{id}', [ClassesController::class, 'updateClass']);
    Route::delete('/classes/{id}', [ClassesController::class, 'deleteClass']);

    // ====================
    // Students
    // ====================

    Route::post('/students', [StudentController::class, 'addStudent']);
    Route::get('/student/{id}', [StudentController::class, 'getStudent']);
    Route::put('/student/{id}', [StudentController::class, 'updateStudent']);
    Route::delete('/student/{id}', [StudentController::class, 'deleteStudent']);
    Route::get('/student/class/{id}', [StudentController::class, 'getAllStudentFromClass']);
    Route::get('/student/{id}/subjects', [StudentController::class, 'getStudentSubjects']);

    // ====================
    // Teachers
    // ====================

    Route::post('/teachers', [TeacherController::class, 'createTeacher']);
    Route::get('/teachers', [TeacherController::class, 'getAllTeachers']);
    Route::get('/teachers/{id}', [TeacherController::class, 'getTeacher']);
    Route::put('/teachers/{id}', [TeacherController::class, 'updateTeacher']);
    Route::delete('/teachers/{id}', [TeacherController::class, 'deleteTeacher']);
    Route::get('/teacher/{id}/subjects', [TeacherController::class, 'getTeacherSubjects']);

    // ====================
    // Subject
    // ====================
    Route::get('/subjects', [SubjectController::class, 'getAllSubjects']);
    Route::get('/subjects/{id}', [SubjectController::class, 'getSubject']);
    Route::post('/subjects', [SubjectController::class, 'createSubject']);
    Route::put('/subjects/{id}', [SubjectController::class, 'updateSubject']);
    Route::delete('/subjects/{id}', [SubjectController::class, 'deleteSubject']);

    // ====================
    // Attendance
    // ====================

    Route::post('/attendance', [AttendanceController::class, 'markAttendance']);
    Route::get('/attendance/class', [AttendanceController::class, 'getAttendanceByClass']);
    Route::get('/attendance/student/{id}', [AttendanceController::class, 'getStudentAttendance']);
    Route::put('/attendance/{id}', [AttendanceController::class, 'updateAttendance']);

    // ====================
    // Homework
    // ====================

    Route::post('/homework', [HomeworkController::class, 'createHomework']);
    Route::get('/homework/{id}', [HomeworkController::class, 'getHomework']);
    Route::put('/homework/{id}', [HomeworkController::class, 'updateHomework']);
    Route::delete('/homework/{id}', [HomeworkController::class, 'deleteHomework']);
    Route::get('/homework/class/{classId}', [HomeworkController::class, 'getHomeworkByClass']);
    Route::get('/homework/student/{studentId}', [HomeworkController::class, 'getHomeworkByStudent']);

    // ====================
    // Scores
    // ====================

    Route::post('/scores', [ScoreController::class, 'addScore']);
    Route::get('/scores/{id}', [ScoreController::class, 'getScore']);
    Route::put('/scores/{id}', [ScoreController::class, 'updateScore']);
    Route::delete('/scores/{id}', [ScoreController::class, 'deleteScore']);
    Route::get('/scores/class/{classId}', [ScoreController::class, 'getScoresByClass']);
    Route::get('/scores/student/{studentId}', [ScoreController::class, 'getStudentScores']);

    // ====================
    // Leaderboard
    // ====================

    Route::get('/leaderboard/class/{classId}', [LeaderboardController::class, 'getLeaderboardByClass']);

    // ====================
    // Announcements
    // ====================

    Route::post('/announcements', [AnnouncementController::class, 'createAnnouncement']);
    Route::get('/announcements', [AnnouncementController::class, 'getAnnouncements']);
    Route::get('/announcements/class/{classId}', [AnnouncementController::class, 'getAnnouncementsByClass']);
    Route::get('/announcements/student/{studentId}', [AnnouncementController::class, 'getAnnouncementsByStudent']);
    Route::get('/announcements/{id}', [AnnouncementController::class, 'getAnnouncement']);
    Route::put('/announcements/{id}', [AnnouncementController::class, 'updateAnnouncement']);
    Route::delete('/announcements/{id}', [AnnouncementController::class, 'deleteAnnouncement']);

});
