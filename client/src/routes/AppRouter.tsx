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

import TeacherDashboard from '@/pages/teacher/Dashboard';
import StudentDashboard from '@/pages/student/Dashboard';

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
          </Route>
        </Route>

        {/* Teacher */}
        <Route element={<ProtectedRoute allow={['teacher']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          </Route>
        </Route>

        {/* Student */}
        <Route element={<ProtectedRoute allow={['student']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
