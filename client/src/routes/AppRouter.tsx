import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '@/layouts/DashboardLayout';

import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Unauthorized from '@/pages/Unauthorized';

import ManagementDashboard from '@/pages/management/Dashboard';
import TeacherList from '@/pages/management/Teachers/TeacherList';
import AddTeacher from '@/pages/management/Teachers/AddTeacher';
import EditTeacher from '@/pages/management/Teachers/EditTeacher';
import TeacherSubjects from '@/pages/management/Teachers/TeacherSubjects';
import ClassList from '@/pages/management/Classes/ClassList';
import ClassForm from '@/pages/management/Classes/ClassForm';
import StudentsByClass from '@/pages/management/Students/StudentsByClass';
import AddStudent from '@/pages/management/Students/AddStudent';
import EditStudent from '@/pages/management/Students/EditStudent';
import StudentSubjects from '@/pages/management/Students/StudentSubjects';
import SubjectList from '@/pages/management/Subjects/SubjectList';
import SubjectForm from '@/pages/management/Subjects/SubjectForm';
import MarkAttendance from '@/pages/management/Attendance/MarkAttendance';
import ViewAttendance from '@/pages/management/Attendance/ViewAttendance';
import HomeworkList from '@/pages/management/Homework/HomeworkList';
import AddHomework from '@/pages/management/Homework/AddHomework';
import EditHomework from '@/pages/management/Homework/EditHomework';
import ScoresByClass from '@/pages/management/Scores/ScoresByClass';
import AddScore from '@/pages/management/Scores/AddScore';
import EditScore from '@/pages/management/Scores/EditScore';
import LeaderboardByClass from '@/pages/management/Leaderboard/LeaderboardByClass';
import AnnouncementList from '@/pages/management/Announcements/AnnouncementList';
import AddAnnouncement from '@/pages/management/Announcements/AddAnnouncement';
import EditAnnouncement from '@/pages/management/Announcements/EditAnnouncement';
import TimetableGrid from '@/pages/management/Timetable/TimetableGrid';
import ConcernList from '@/pages/management/Concerns/ConcernList';

import TeacherDashboard from '@/pages/teacher/Dashboard';
import TeacherTimetable from '@/pages/teacher/Timetable';
import TeacherScores from '@/pages/teacher/Scores';
import TeacherAnnouncements from '@/pages/teacher/Announcements';
import TeacherConcerns from '@/pages/teacher/Concerns';
import TeacherMarkAttendance from '@/pages/teacher/MarkAttendance';
import TeacherHomeworkList from '@/pages/teacher/Homework/HomeworkList';
import TeacherAddHomework from '@/pages/teacher/Homework/AddHomework';
import TeacherEditHomework from '@/pages/teacher/Homework/EditHomework';
import TeacherStudentsAnalytics from '@/pages/teacher/analytics/StudentsAnalytics';
import TeacherClassPerformanceAnalytics from '@/pages/teacher/analytics/ClassPerformanceAnalytics';
import TeacherAttendanceAnalytics from '@/pages/teacher/analytics/AttendanceAnalytics';
import StudentDashboard from '@/pages/student/Dashboard';
import StudentTimetable from '@/pages/student/Timetable';
import StudentConcerns from '@/pages/student/Concerns';
import StudentPerformance from '@/pages/student/Performance';
import StudentSubjectsAnalytics from '@/pages/student/analytics/SubjectsAnalytics';
import StudentRankAnalytics from '@/pages/student/analytics/RankAnalytics';
import StudentComparisonAnalytics from '@/pages/student/analytics/ComparisonAnalytics';
import StudentProgressAnalytics from '@/pages/student/analytics/ProgressAnalytics';
import StudentAttendanceAnalytics from '@/pages/student/analytics/AttendanceAnalytics';
import ManagementActivityAnalytics from '@/pages/management/analytics/ActivityAnalytics';
import ManagementSubjectAnalytics from '@/pages/management/analytics/SubjectPerformanceAnalytics';
import ManagementClassPerformanceAnalytics from '@/pages/management/analytics/ClassPerformanceAnalytics';
import ManagementInstructorAnalytics from '@/pages/management/analytics/InstructorAnalytics';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Management */}
        <Route element={<ProtectedRoute allow={['management']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/management/dashboard" element={<ManagementDashboard />} />
            <Route path="/management/teachers" element={<TeacherList />} />
            <Route path="/management/teachers/new" element={<AddTeacher />} />
            <Route path="/management/teachers/:id/edit" element={<EditTeacher />} />
            <Route path="/management/teachers/:id/subjects" element={<TeacherSubjects />} />
            <Route path="/management/classes" element={<ClassList />} />
            <Route path="/management/classes/new" element={<ClassForm />} />
            <Route path="/management/classes/:id/edit" element={<ClassForm />} />
            <Route path="/management/students" element={<StudentsByClass />} />
            <Route path="/management/students/new" element={<AddStudent />} />
            <Route path="/management/students/:id/edit" element={<EditStudent />} />
            <Route path="/management/students/:id/subjects" element={<StudentSubjects />} />
            <Route path="/management/subjects" element={<SubjectList />} />
            <Route path="/management/subjects/new" element={<SubjectForm />} />
            <Route path="/management/subjects/:id/edit" element={<SubjectForm />} />
            <Route path="/management/attendance" element={<MarkAttendance />} />
            <Route path="/management/attendance/view" element={<ViewAttendance />} />
            <Route path="/management/homework" element={<HomeworkList />} />
            <Route path="/management/homework/new" element={<AddHomework />} />
            <Route path="/management/homework/:id/edit" element={<EditHomework />} />
            <Route path="/management/scores" element={<ScoresByClass />} />
            <Route path="/management/scores/new" element={<AddScore />} />
            <Route path="/management/scores/:id/edit" element={<EditScore />} />
            <Route path="/management/leaderboard" element={<LeaderboardByClass />} />
            <Route path="/management/announcements" element={<AnnouncementList />} />
            <Route path="/management/announcements/new" element={<AddAnnouncement />} />
            <Route path="/management/announcements/:id/edit" element={<EditAnnouncement />} />
            <Route path="/management/timetable" element={<TimetableGrid />} />
            <Route path="/management/concerns" element={<ConcernList />} />
            <Route path="/management/performance" element={<StudentPerformance />} />
            <Route path="/management/analytics/activity" element={<ManagementActivityAnalytics />} />
            <Route path="/management/analytics/subjects" element={<ManagementSubjectAnalytics />} />
            <Route path="/management/analytics/class-performance" element={<ManagementClassPerformanceAnalytics />} />
            <Route path="/management/analytics/instructors" element={<ManagementInstructorAnalytics />} />
          </Route>
        </Route>

        {/* Teacher */}
        <Route element={<ProtectedRoute allow={['teacher']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/timetable" element={<TeacherTimetable />} />
            <Route path="/teacher/scores" element={<TeacherScores />} />
            <Route path="/teacher/attendance" element={<TeacherMarkAttendance />} />
            <Route path="/teacher/homework" element={<TeacherHomeworkList />} />
            <Route path="/teacher/homework/new" element={<TeacherAddHomework />} />
            <Route path="/teacher/homework/:id/edit" element={<TeacherEditHomework />} />
            <Route path="/teacher/announcements" element={<TeacherAnnouncements />} />
            <Route path="/teacher/concerns" element={<TeacherConcerns />} />
            <Route path="/teacher/performance" element={<StudentPerformance />} />
            <Route path="/teacher/analytics/students" element={<TeacherStudentsAnalytics />} />
            <Route path="/teacher/analytics/class-performance" element={<TeacherClassPerformanceAnalytics />} />
            <Route path="/teacher/analytics/attendance" element={<TeacherAttendanceAnalytics />} />
          </Route>
        </Route>

        {/* Student */}
        <Route element={<ProtectedRoute allow={['student']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/timetable" element={<StudentTimetable />} />
            <Route path="/student/performance" element={<StudentPerformance />} />
            <Route path="/student/concerns" element={<StudentConcerns />} />
            <Route path="/student/analytics/subjects" element={<StudentSubjectsAnalytics />} />
            <Route path="/student/analytics/rank" element={<StudentRankAnalytics />} />
            <Route path="/student/analytics/comparison" element={<StudentComparisonAnalytics />} />
            <Route path="/student/analytics/progress" element={<StudentProgressAnalytics />} />
            <Route path="/student/analytics/attendance" element={<StudentAttendanceAnalytics />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
