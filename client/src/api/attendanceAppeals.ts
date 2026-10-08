import api from './axios';
import type {
    AttendanceAppeal,
    AttendanceAppealInput,
    AttendanceAppealStatus,
    AttendanceAppealUpdateInput,
} from '@/types';

export const createAttendanceAppeal = (payload: AttendanceAppealInput) =>
    api.post<{ message: string; correction: AttendanceAppeal }>('/attendance-corrections', payload);

export const getMyAttendanceAppeals = () =>
    api.get<{ message: string; corrections: AttendanceAppeal[] }>('/attendance-corrections/mine');

export const getAttendanceAppeals = (status?: AttendanceAppealStatus) =>
    api.get<{ message: string; corrections: AttendanceAppeal[] }>('/attendance-corrections', {
        params: status ? { status } : undefined,
    });

export const handleAttendanceAppeal = (id: number, payload: AttendanceAppealUpdateInput) =>
    api.put<{ message: string; correction: AttendanceAppeal }>(`/attendance-corrections/${id}`, payload);