import api from './axios';
import type {
    HeadToHeadResponse,
    ProgressResponse,
    StudentGapsResponse,
    SubjectComparisonResponse,
} from '@/types';

export const getSubjectComparison = (
    classId: number,
    subjectId: number,
    params?: { exam?: string; semester?: string },
) =>
    api.get<SubjectComparisonResponse>(`/comparison/subject/${classId}/${subjectId}`, {
        params,
    });

export const getStudentGaps = (studentId: number, semester?: string) =>
    api.get<StudentGapsResponse>(`/comparison/gaps/${studentId}`, {
        params: semester ? { semester } : {},
    });

export const getStudentProgress = (studentId: number) =>
    api.get<ProgressResponse>(`/comparison/progress/${studentId}`);

export const getHeadToHead = (
    studentA: number,
    studentB: number,
    semester?: string,
) =>
    api.get<HeadToHeadResponse>(`/comparison/headtohead/${studentA}/${studentB}`, {
        params: semester ? { semester } : {},
    });