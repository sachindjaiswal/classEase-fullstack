import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '@/layouts/DashboardLayout';

import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Unauthorized from '@/pages/Unauthorized';

import ManagementDashboard from '@/pages/management/Dashboard';
import TeacherList from '@/pages/management/Teachers/TeacherList';
import AddTeacher from '@/pages/management/Teachers/AddTeacher';
import ClassList from '@/pages/management/Classes/ClassList';
import ClassForm from '@/pages/management/Classes/ClassForm';
import StudentsByClass from '@/pages/management/Students/StudentsByClass';
import AddStudent from '@/pages/management/Students/AddStudent';

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
            <Route path="/management/classes" element={<ClassList />} />
            <Route path="/management/classes/new" element={<ClassForm />} />
            <Route path="/management/classes/:id/edit" element={<ClassForm />} />
            <Route path="/management/students" element={<StudentsByClass />} />
            <Route path="/management/students/new" element={<AddStudent />} />
            {/* announcements, timetable routes go here as they're built */}
          </Route>
        </Route>

        {/* Teacher */}
        <Route element={<ProtectedRoute allow={['teacher']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            {/* attendance, homework, scores, concerns routes go here */}
          </Route>
        </Route>

        {/* Student */}
        <Route element={<ProtectedRoute allow={['student']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            {/* performance, leaderboard, concerns routes go here */}
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
