import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMyStudent, getStudentSubjects } from '@/api/students';
import { getStudentScores } from '@/api/scores';
import type { DatedScore } from '@/pages/analytics/metrics';
import type { Student, SubjectFull } from '@/types';

export interface StudentData {
    student: Student | null;
    subjects: SubjectFull[];
    scores: DatedScore[];
    subjectPercent: SubjectPercentRow[];
    loading: boolean;
    error: string | null;
}

export function useStudentData(): StudentData {
    const { user } = useAuth();
    const [student, setStudent] = useState<Student | null>(null);
    const [subjects, setSubjects] = useState<SubjectFull[]>([]);
    const [scores, setScores] = useState<DatedScore[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await getMyStudent();
                const s = res.data.student;
                const [subjectsRes, scoresRes] = await Promise.all([
                    getStudentSubjects(s.id),
                    getStudentScores(s.id),
                ]);
                if (cancelled) return;
                setStudent(s);
                setSubjects(subjectsRes.data.subjects);
                setScores(scoresRes.data.scores as unknown as DatedScore[]);
            } catch {
                if (!cancelled) setError("Couldn't load analytics data.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [user]);

    const subjectPercent = useMemo(() => {
        const map: Record<number, { name: string; percent: number; count: number }> = {};
        scores.forEach((sc) => {
            const key = sc.subject_id;
            const name = sc.subject?.subjectName ?? `Subject ${sc.subject_id}`;
            if (!map[key]) map[key] = { name, percent: 0, count: 0 };
            map[key].percent += sc.total_marks ? (sc.marks_obtained / sc.total_marks) * 100 : 0;
            map[key].count += 1;
        });
        return Object.values(map)
            .map((v) => ({ ...v, percent: v.count ? Math.round(v.percent / v.count) : 0 }))
            .sort((a, b) => b.percent - a.percent);
    }, [scores]);

    return { student, subjects, scores, loading, error, subjectPercent };
}

export interface SubjectPercentRow {
    name: string;
    percent: number;
    count: number;
}