export const EXAM_TYPES = ['Unit Test', 'Midterm Exam', 'Final Exam'] as const;

export type ExamType = (typeof EXAM_TYPES)[number];