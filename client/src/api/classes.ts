import api from './axios';
import type { SchoolClass, ClassInput } from '@/types';

export const getClasses = () =>
  api.get<{ message: string; classes: SchoolClass[] }>('/classes');

export const createClass = (payload: ClassInput) =>
  api.post<{ message: string; class: SchoolClass }>('/classes', payload);

export const updateClass = (id: number, payload: Partial<ClassInput>) =>
  api.put<{ message: string; class: SchoolClass }>(`/classes/${id}`, payload);

export const deleteClass = (id: number) =>
  api.delete<{ message: string }>(`/classes/${id}`);
