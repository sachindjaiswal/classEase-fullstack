import api from './axios';
import type { AttendancePayload, AttendanceItem, AttendanceRecord, AttendanceSummary } from '@/types';

export const markAttendance = (payload: AttendancePayload) =>
    api.post<{ message: string }>('/attendance', payload);

export const getAttendanceByClass = (classId: number, date: string) =>
    api.get<{ date: string; class_id: number; attendance: AttendanceItem[] }>('/attendance/class', {
        params: { class_id: classId, date },
    });

export const getStudentAttendance = (id: number) =>
    api.get<{
        student: { id: number; firstName: string; surname: string };
        summary: AttendanceSummary;
        attendance: AttendanceRecord[];
    }>(`/attendance/student/${id}`);

export const updateAttendance = (id: number, payload: { status: string; remarks?: string }) =>
    api.put<{ message: string; attendance: AttendanceRecord }>(`/attendance/${id}`, payload);
