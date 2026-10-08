import api from './axios';
import type { Concern, ConcernInput, ConcernUpdateInput } from '@/types';

export const createConcern = (payload: ConcernInput) =>
    api.post<{ message: string; concern: Concern }>('/concerns', payload);

export const getConcerns = () =>
    api.get<{ message: string; concerns: Concern[] }>('/concerns');

export const getConcern = (id: number) =>
    api.get<{ message: string; concern: Concern }>(`/concerns/${id}`);

export const getConcernsByStudent = (studentId: number) =>
    api.get<{ message: string; concerns: Concern[] }>(`/concerns/student/${studentId}`);

export const updateConcern = (id: number, payload: ConcernUpdateInput) =>
    api.put<{ message: string; concern: Concern }>(`/concerns/${id}`, payload);

export const deleteConcern = (id: number) =>
    api.delete<{ message: string }>(`/concerns/${id}`);