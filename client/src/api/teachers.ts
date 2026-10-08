import api from './axios';
import type { Teacher, TeacherInput, SubjectFull } from '@/types';

export const getTeachers = () => api.get<Teacher[]>('/teachers');

export const getTeacher = (id: number) => api.get<Teacher>(`/teachers/${id}`);

export const getTeacherMe = () => api.get<Teacher>('/teacher/me');

export const createTeacher = (payload: TeacherInput) =>
  api.post<{ message: string; teacher: Teacher }>('/teachers', payload);

export const updateTeacher = (id: number, payload: Partial<TeacherInput>) =>
  api.put<{ message: string; teacher: Teacher }>(`/teachers/${id}`, payload);

export const deleteTeacher = (id: number) =>
  api.delete<{ message: string }>(`/teachers/${id}`);

export const getTeacherSubjects = (id: number) =>
  api.get<{ message: string; subjects: SubjectFull[] }>(`/teacher/${id}/subjects`);
