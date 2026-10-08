import { useMemo, useState } from 'react';
import AnalyticsHeader from '@/pages/analytics/AnalyticsHeader';
import StatCard from '@/pages/analytics/StatCard';
import DataTable from '@/pages/analytics/DataTable';
import { useManagementData } from '@/pages/analytics/useManagementData';
import { percentageOf, truncateLabel } from '@/pages/analytics/metrics';
import Card from '@/components/dashboard/Card';
import Top5Bar from '@/components/dashboard/Top5Bar';
import { CHART_COLORS } from '@/components/charts/palette';

interface SubjectRow {
    subjectId: number;
    name: string;
    avgs: number;
    count: number;
    pass: number;
}

function subjectLabel(sc: { subject_id: number; subject?: { subjectName?: string } | null }): string {
    return sc.subject?.subjectName ?? `Subject #${sc.subject_id}`;
}

export default function SubjectPerformanceAnalytics() {
    const { allScores, loading, error } = useManagementData();
    const [sortBy, setSortBy] = useState<'avg' | 'count'>('avg');

    const subjects = useMemo(() => {
        const map = new Map<number, SubjectRow>();
        allScores.forEach((sc) => {
            const acc = map.get(sc.subject_id) || {
                subjectId: sc.subject_id,
                name: subjectLabel(sc),
                avgs: 0,
                count: 0,
                pass: 0,
            };
            acc.avgs += percentageOf(sc);
            acc.count += 1;
            if (percentageOf(sc) >= 50) acc.pass += 1;
            map.set(sc.subject_id, acc);
        });
        return Array.from(map.values()).map((r) => ({ ...r, avg: r.count ? Math.round(r.avgs / r.count) : 0 }));
    }, [allScores]);

    const ranked = useMemo(() => {
        const sorted = [...subjects];
        if (sortBy === 'avg') sorted.sort((a, b) => b.avg - a.avg);
        else sorted.sort((a, b) => b.count - a.count);
        return sorted;
    }, [subjects, sortBy]);

    const top5 = useMemo(() => ranked.slice(0, 5).map((r) => ({ label: r.name, value: r.avg })), [ranked]);

    const stats = useMemo(() => {
        const best = subjects.length
            ? subjects.reduce((a, b) => (b.avg > a.avg ? b : a))
            : null;
        return {
            subjects: subjects.length,
            assessments: subjects.reduce((a, b) => a + b.count, 0),
            best: best ? `${best.name}` : '—',
            bestAvg: best ? `${best.avg}%` : '—',
        };
    }, [subjects]);

    const select = (
        <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'avg' | 'count')}
            className="max-w-[160px] rounded-lg border border-border bg-surface px-2 py-1 text-xs text-ink2 outline-none"
        >
            <option value="avg">By average %</option>
            <option value="count">By assessments</option>
        </select>
    );

    if (loading) return <p className="text-sm text-muted">Loading...</p>;
    if (error) return <p className="text-sm text-danger">{error}</p>;

    return (
        <div className="min-w-0 space-y-6">
            <AnalyticsHeader
                backTo="/management/dashboard"
                title="Subject Performance in Detail"
                subtitle="Every subject ranked by average percentage of assessments."
                children={select}
            />

            <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-4">
                <StatCard label="Subjects Tracked" value={stats.subjects} color={CHART_COLORS.blue} />
                <StatCard label="Assessments" value={stats.assessments} color={CHART_COLORS.gold} />
                <StatCard label="Top Subject" value={stats.best} sub={stats.bestAvg} color={CHART_COLORS.success} />
                <StatCard label="Needs Attention" value={ranked.filter((r) => r.avg < 50).length} color={CHART_COLORS.danger} />
            </div>

            <Card title="Best Performing Subjects" subtitle="Top 5 by average %" pad={false}>
                <div className="min-w-0 p-4 sm:p-5">
                    {top5.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted">No scores yet.</p>
                    ) : (
                        <Top5Bar data={top5} height={240} unit="%" width={96} />
                    )}
                </div>
            </Card>

            <Card title="Full Subject Ranking" subtitle="All subjects with assessment volume and pass rates" pad={false}>
                <div className="p-4 sm:p-5">
                    <DataTable<SubjectRow & { avg: number }>
                        data={ranked}
                        keyFor={(r) => r.subjectId}
                        empty="No scores recorded yet."
                        columns={[
                            {
                                header: '#',
                                className: 'w-10',
                                render: (_, i) => {
                                    const color =
                                        i === 0 ? CHART_COLORS.gold : i === 1 ? CHART_COLORS.ink2 : i === 2 ? CHART_COLORS.goldDark : 'inherit';
                                    return <span className="font-semibold" style={{ color }}>{i + 1}</span>;
                                },
                            },
                            { header: 'Subject', render: (r) => <span className="font-medium text-ink2">{truncateLabel(r.name)}</span> },
                            {
                                header: 'Assessments',
                                className: 'text-right',
                                render: (r) => <span className="text-muted">{r.count}</span>,
                            },
                            {
                                header: 'Pass Rate',
                                className: 'text-right',
                                render: (r) => (
                                    <span className={`font-semibold ${r.count ? (r.pass / r.count >= 0.5 ? 'text-success' : 'text-danger') : 'text-muted'}`}>
                                        {r.count ? `${Math.round((r.pass / r.count) * 100)}%` : '—'}
                                    </span>
                                ),
                            },
                            {
                                header: 'Average',
                                className: 'text-right',
                                render: (r) => (
                                    <span className="font-semibold" style={{ color: CHART_COLORS.blue }}>
                                        {r.avg}%
                                    </span>
                                ),
                            },
                        ]}
                    />
                </div>
            </Card>
        </div>
    );
}