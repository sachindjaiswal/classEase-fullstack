<?php

use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClassesController;
use App\Http\Controllers\ComparisonController;
use App\Http\Controllers\ConcernController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeworkController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\ScoreController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\TimetableController;
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

    // Authentication — all roles
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // ====================
    // Admin-only: management (dashboard stats, CRUD on all entities)
    // ====================

    Route::middleware('role:admin')->group(function () {

        // Dashboard
        Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);

        // Classes
        Route::get('/classes', [ClassesController::class, 'getAllClasses']);
        Route::get('/classes/{id}', [ClassesController::class, 'getClass']);
        Route::post('/classes', [ClassesController::class, 'createClass']);
        Route::put('/classes/{id}', [ClassesController::class, 'updateClass']);
        Route::delete('/classes/{id}', [ClassesController::class, 'deleteClass']);

        // Students
        Route::post('/students', [StudentController::class, 'addStudent']);
        Route::put('/student/{id}', [StudentController::class, 'updateStudent']);
        Route::delete('/student/{id}', [StudentController::class, 'deleteStudent']);

        // Teachers
        Route::post('/teachers', [TeacherController::class, 'createTeacher']);
        Route::get('/teachers', [TeacherController::class, 'getAllTeachers']);
        Route::put('/teachers/{id}', [TeacherController::class, 'updateTeacher']);
        Route::delete('/teachers/{id}', [TeacherController::class, 'deleteTeacher']);

        // Subjects
        Route::get('/subjects', [SubjectController::class, 'getAllSubjects']);
        Route::post('/subjects', [SubjectController::class, 'createSubject']);
        Route::put('/subjects/{id}', [SubjectController::class, 'updateSubject']);
        Route::delete('/subjects/{id}', [SubjectController::class, 'deleteSubject']);

    });

    // ====================
    // Admin + Teacher: academic write/manage (attendance, homework,
    // scores, announcements) and shared read endpoints
    // ====================

    Route::middleware('role:admin,teacher')->group(function () {

        // Teachers — own/subject reads
        Route::get('/teachers/{id}', [TeacherController::class, 'getTeacher']);
        Route::get('/teacher/me', [TeacherController::class, 'getTeacherMe']);
        Route::get('/teacher/{id}/subjects', [TeacherController::class, 'getTeacherSubjects']);

        // Subjects — read
        Route::get('/subjects/{id}', [SubjectController::class, 'getSubject']);
        Route::get('/subjects/class/{classId}', [SubjectController::class, 'getSubjectsByClass']);

        // Attendance
        Route::post('/attendance', [AttendanceController::class, 'markAttendance']);
        Route::get('/attendance/class', [AttendanceController::class, 'getAttendanceByClass']);
        Route::put('/attendance/{id}', [AttendanceController::class, 'updateAttendance']);

        // Homework — write
        Route::post('/homework', [HomeworkController::class, 'createHomework']);
        Route::put('/homework/{id}', [HomeworkController::class, 'updateHomework']);
        Route::delete('/homework/{id}', [HomeworkController::class, 'deleteHomework']);

        // Scores — write
        Route::post('/scores', [ScoreController::class, 'addScore']);
        Route::put('/scores/{id}', [ScoreController::class, 'updateScore']);
        Route::delete('/scores/{id}', [ScoreController::class, 'deleteScore']);

        // Announcements — write
        Route::post('/announcements', [AnnouncementController::class, 'createAnnouncement']);
        Route::put('/announcements/{id}', [AnnouncementController::class, 'updateAnnouncement']);
        Route::delete('/announcements/{id}', [AnnouncementController::class, 'deleteAnnouncement']);

        // Timetable — write
        Route::post('/timetable', [TimetableController::class, 'saveTimetable']);
        Route::put('/timetable/{id}', [TimetableController::class, 'updateTimetable']);
        Route::delete('/timetable/{id}', [TimetableController::class, 'deleteTimetable']);

        // Concerns — manage
        Route::get('/concerns', [ConcernController::class, 'getConcerns']);
        Route::put('/concerns/{id}', [ConcernController::class, 'updateConcern']);
        Route::delete('/concerns/{id}', [ConcernController::class, 'deleteConcern']);

    });

    // ====================
    // Student: raise concerns
    // ====================

    Route::middleware('role:student')->group(function () {

        Route::post('/concerns', [ConcernController::class, 'createConcern']);

    });

    // ====================
    // All authenticated roles: read/view (students read their own data)
    // ====================

    Route::middleware('role:admin,teacher,student')->group(function () {

        // Dashboard — notices + tasks feed (scoped per role)
        Route::get('/dashboard/feed', [DashboardController::class, 'getFeed']);

        // Students — own record, subjects, class roster (students: own class only)
        Route::get('/student/me', [StudentController::class, 'getMyStudent']);
        Route::get('/student/class/{id}', [StudentController::class, 'getAllStudentFromClass']);
        Route::get('/student/{id}', [StudentController::class, 'getStudent']);
        Route::get('/student/{id}/subjects', [StudentController::class, 'getStudentSubjects']);

        // Attendance — own history
        Route::get('/attendance/student/{id}', [AttendanceController::class, 'getStudentAttendance']);

        // Homework — read
        Route::get('/homework/{id}', [HomeworkController::class, 'getHomework']);
        Route::get('/homework/class/{classId}', [HomeworkController::class, 'getHomeworkByClass']);
        Route::get('/homework/student/{studentId}', [HomeworkController::class, 'getHomeworkByStudent']);

        // Scores — read
        Route::get('/scores/{id}', [ScoreController::class, 'getScore']);
        Route::get('/scores/class/{classId}', [ScoreController::class, 'getScoresByClass']);
        Route::get('/scores/student/{studentId}', [ScoreController::class, 'getStudentScores']);

        // Leaderboard
        Route::get('/leaderboard/class/{classId}', [LeaderboardController::class, 'getLeaderboardByClass']);

        // Comparison — performance insights
        Route::get('/comparison/subject/{classId}/{subjectId}', [ComparisonController::class, 'bySubject']);
        Route::get('/comparison/gaps/{studentId}', [ComparisonController::class, 'gaps']);
        Route::get('/comparison/progress/{studentId}', [ComparisonController::class, 'progress']);
        Route::get('/comparison/headtohead/{studentA}/{studentB}', [ComparisonController::class, 'headToHead']);

        // Announcements — read
        Route::get('/announcements', [AnnouncementController::class, 'getAnnouncements']);
        Route::get('/announcements/class/{classId}', [AnnouncementController::class, 'getAnnouncementsByClass']);
        Route::get('/announcements/student/{studentId}', [AnnouncementController::class, 'getAnnouncementsByStudent']);
        Route::get('/announcements/{id}', [AnnouncementController::class, 'getAnnouncement']);

        // Timetable — read
        Route::get('/timetable/class/{classId}', [TimetableController::class, 'getTimetableByClass']);
        Route::get('/timetable/teacher/{teacherId}', [TimetableController::class, 'getTimetableByTeacher']);

        // Concerns — read (students see only their own)
        Route::get('/concerns/student/{studentId}', [ConcernController::class, 'getConcernsByStudent']);
        Route::get('/concerns/{id}', [ConcernController::class, 'getConcern']);

    });

});
