import api from './axios';
import type { Student, StudentInput } from '@/types';

export const createStudent = (payload: StudentInput) =>
  api.post<{ message: string; student: Student }>('/students', payload);

export const getStudent = (id: number) =>
  api.get<{ message: string; student: Student }>(`/student/${id}`);

export const getStudentsByClass = (classId: number) =>
  api.get<Student[]>(`/student/class/${classId}`);
