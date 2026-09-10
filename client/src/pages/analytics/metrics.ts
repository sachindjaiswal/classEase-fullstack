import type { ScoreFull } from '@/types';

export type DatedScore = ScoreFull & { created_at?: string };

export function localYmd(d: Date): string {
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
}

export function monthKey(dateStr: string): string {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

export function monthLabel(dateStr: string): string {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

export function percentageOf(s: ScoreFull): number {
    return s.total_marks ? Math.round((s.marks_obtained / s.total_marks) * 100) : 0;
}

export function classLabel(name: string, section?: string | null): string {
    return `${name}${section ? ` ${section}` : ''}`;
}

export function truncateLabel(value: string, max = 16): string {
    return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}