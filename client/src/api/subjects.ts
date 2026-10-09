import api from './axios';
import type { Subject, SubjectInput, SubjectFull } from '@/types';

export const getSubjects = () =>
  api.get<{ message: string; subjects: SubjectFull[] }>('/subjects');

export const getSubjectsByClass = (classId: number) =>
  api.get<{ message: string; subjects: SubjectFull[] }>(`/subjects/class/${classId}`);

export const getSubject = (id: number) =>
  api.get<{ message: string; subject: Subject }>(`/subjects/${id}`);

export const createSubject = (payload: SubjectInput) =>
  api.post<{ message: string; subject: Subject }>('/subjects', payload);

export const updateSubject = (id: number, payload: Partial<SubjectInput>) =>
  api.put<{ message: string; subject: Subject }>(`/subjects/${id}`, payload);

export const deleteSubject = (id: number) =>
  api.delete<{ message: string }>(`/subjects/${id}`);