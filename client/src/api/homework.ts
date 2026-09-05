import api from './axios';
import type { Homework, HomeworkInput } from '@/types';

export const createHomework = (payload: HomeworkInput) =>
    api.post<{ message: string; homework: Homework }>('/homework', payload);

export const getHomework = (id: number) =>
    api.get<{ message: string; homework: Homework }>(`/homework/${id}`);

export const updateHomework = (id: number, payload: Partial<HomeworkInput>) =>
    api.put<{ message: string; homework: Homework }>(`/homework/${id}`, payload);

export const deleteHomework = (id: number) =>
    api.delete<{ message: string }>(`/homework/${id}`);

export const getHomeworkByClass = (classId: number) =>
    api.get<{ message: string; homeworks: Homework[] }>(`/homework/class/${classId}`);

export const getHomeworkByStudent = (studentId: number) =>
    api.get<{ message: string; homeworks: Homework[] }>(`/homework/student/${studentId}`);
