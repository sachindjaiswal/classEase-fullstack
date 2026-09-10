import api from './axios';
import type { Student, StudentInput, SubjectFull } from '@/types';

export const createStudent = (payload: StudentInput) =>
  api.post<{ message: string; student: Student }>('/students', payload);

export const getStudent = (id: number) =>
  api.get<{ message: string; student: Student }>(`/student/${id}`);

export const getMyStudent = () =>
  api.get<{ message: string; student: Student }>('/student/me');

export const updateStudent = (id: number, payload: Partial<StudentInput>) =>
  api.put<{ message: string; student: Student }>(`/student/${id}`, payload);

export const deleteStudent = (id: number) =>
  api.delete<{ message: string }>(`/student/${id}`);

export const getStudentsByClass = (classId: number) =>
  api.get<Student[]>(`/student/class/${classId}`);

export const getStudentSubjects = (id: number) =>
  api.get<{ message: string; subjects: SubjectFull[] }>(`/student/${id}/subjects`);