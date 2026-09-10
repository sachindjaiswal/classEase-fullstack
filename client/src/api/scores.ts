import api from './axios';
import type { Score, ScoreInput, ScoreFull } from '@/types';

export const createScore = (payload: ScoreInput) =>
    api.post<{ message: string; score: ScoreFull }>('/scores', payload);

export const getScore = (id: number) =>
    api.get<{ message: string; score: ScoreFull }>(`/scores/${id}`);

export const updateScore = (id: number, payload: Partial<ScoreInput>) =>
    api.put<{ message: string; score: ScoreFull }>(`/scores/${id}`, payload);

export const deleteScore = (id: number) =>
    api.delete<{ message: string }>(`/scores/${id}`);

export const getScoresByClass = (classId: number) =>
    api.get<{ message: string; scores: ScoreFull[] }>(`/scores/class/${classId}`);

export const getStudentScores = (studentId: number) =>
    api.get<{ message: string; scores: ScoreFull[] }>(`/scores/student/${studentId}`);