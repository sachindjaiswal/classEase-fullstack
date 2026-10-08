import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getTeacherMe, getTeacher, getTeacherSubjects } from '@/api/teachers';
import { getClasses } from '@/api/classes';
import { getScoresByClass } from '@/api/scores';
import type { SchoolClass, SubjectFull, Teacher } from '@/types';
import type { DatedScore } from '@/pages/analytics/metrics';

export interface TeacherData {
    teacher: Teacher | null;
    subjects: SubjectFull[];
    classes: SchoolClass[];
    scores: DatedScore[];
    loading: boolean;
    error: string | null;
}

export function useTeacherData(): TeacherData {
    const { user } = useAuth();
    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [subjects, setSubjects] = useState<SubjectFull[]>([]);
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [scores, setScores] = useState<DatedScore[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        (async () => {
            try {
                const me = await getTeacherMe();
                const [teacherRes, subjectsRes, classesRes] = await Promise.all([
                    getTeacher(me.data.id),
                    getTeacherSubjects(me.data.id),
                    getClasses(),
                ]);
                const subjectList = subjectsRes.data.subjects;
                if (cancelled) return;
                setTeacher(teacherRes.data);
                setSubjects(subjectList);
                setClasses(classesRes.data.classes);

                if (!subjectList || subjectList.length === 0) return;
                const classIds = Array.from(new Set(subjectList.map((s) => s.classId)));
                const scoreResults = await Promise.all(
                    classIds.map((cid) =>
                        getScoresByClass(cid).then((r) => ({
                            cid,
                            scores: r.data.scores as unknown as DatedScore[],
                        })),
                    ),
                );
                if (cancelled) return;
                setScores(scoreResults.flatMap((r) => r.scores as DatedScore[]));
            } catch {
                if (!cancelled) setError("Couldn't load analytics data.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const taughtSubjectIds = useMemo(() => new Set(subjects.map((s) => s.id)), [subjects]);
    const classScores = useMemo(
        () => scores.filter((s) => taughtSubjectIds.has(s.subject_id)),
        [scores, taughtSubjectIds],
    );

    return { teacher, subjects, classes, scores: classScores, loading, error };
}