import api from './axios';
import type { SaveTimetablePayload, TimetableSlot, TimetableByTeacherEntry } from '@/types';

export const saveTimetable = (payload: SaveTimetablePayload) =>
    api.post<{ message: string; timetable: TimetableSlot[] }>('/timetable', payload);

export const getTimetableByClass = (classId: number) =>
    api.get<{ message: string; timetable: TimetableSlot[] }>(`/timetable/class/${classId}`);

export const getTimetableByTeacher = (teacherId: number) =>
    api.get<{ message: string; timetable: TimetableByTeacherEntry[] }>(
        `/timetable/teacher/${teacherId}`,
    );

export const updateTimetableEntry = (id: number, payload: Partial<TimetableSlot>) =>
    api.put<{ message: string; entry: TimetableSlot }>(`/timetable/${id}`, payload);

export const deleteTimetableEntry = (id: number) =>
    api.delete<{ message: string }>(`/timetable/${id}`);