import { useEffect, useMemo, useState } from 'react';
import { getClasses } from '@/api/classes';
import { getTeachers } from '@/api/teachers';
import { getStudentsByClass } from '@/api/students';
import { getScoresByClass } from '@/api/scores';
import type { SchoolClass, ScoreFull, Student, Teacher } from '@/types';
import type { DatedScore } from '@/pages/analytics/metrics';

export interface ManagementData {
    classes: SchoolClass[];
    teachers: Teacher[];
    studentsByClass: Record<number, number>;
    scoresByClass: Record<number, DatedScore[]>;
    allScores: DatedScore[];
    totalStudents: number;
    loading: boolean;
    error: string | null;
}

export function useManagementData(): ManagementData {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [studentsByClass, setStudentsByClass] = useState<Record<number, number>>({});
    const [scoresByClass, setScoresByClass] = useState<Record<number, DatedScore[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [classesRes, teachersRes] = await Promise.all([getClasses(), getTeachers()]);
                const classList: SchoolClass[] = classesRes.data.classes;
                const studentCalls = classList.map((c) =>
                    getStudentsByClass(c.id).then((r) => ({ id: c.id, students: r.data as Student[] })),
                );
                const scoreCalls = classList.map((c) =>
                    getScoresByClass(c.id).then((r) => ({
                        id: c.id,
                        scores: r.data.scores as unknown as DatedScore[],
                    })),
                );
                const [studentResults, scoreResults] = await Promise.all([
                    Promise.all(studentCalls),
                    Promise.all(scoreCalls),
                ]);
                if (cancelled) return;
                setClasses(classList);
                setTeachers(teachersRes.data as Teacher[]);
                setStudentsByClass(
                    Object.fromEntries(studentResults.map((r) => [r.id, r.students.length])),
                );
                setScoresByClass(
                    Object.fromEntries(scoreResults.map((r) => [r.id, r.scores as DatedScore[]])),
                );
            } catch {
                if (!cancelled) setError("Couldn't load analytics data.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const allScores: DatedScore[] = useMemo(
        () => Object.values(scoresByClass).flat() as DatedScore[],
        [scoresByClass],
    );

    const totalStudents = useMemo(
        () => Object.values(studentsByClass).reduce((a, b) => a + b, 0),
        [studentsByClass],
    );

    return {
        classes,
        teachers,
        studentsByClass,
        scoresByClass,
        allScores,
        totalStudents,
        loading,
        error,
    };
}