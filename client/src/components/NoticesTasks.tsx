import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import StatusBadge from '@/components/StatusBadge';
import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { getClasses } from '@/api/classes';
import { getSubjects } from '@/api/subjects';
import { getTeacherMe, getTeacherSubjects } from '@/api/teachers';
import {
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
} from '@/api/announcements';
import { createHomework, updateHomework, deleteHomework } from '@/api/homework';
import type { Announcement, ClassSummary, Homework, Subject } from '@/types';

function localYmd(d: Date): string {
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
}

function formatShortDate(value: string | null | undefined): string {
    if (!value) return 'No due date';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'No due date';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function initial(name: string | undefined): string {
    return (name?.trim().charAt(0) ?? 'A').toUpperCase();
}

function classLabel(
    homework: { class?: { class_name?: string; section?: string } | null },
): string | null {
    if (!homework.class) return null;
    return `${homework.class.class_name} — ${homework.class.section}`;
}

function extractErrors(err: unknown): Record<string, string[]> {
    const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
    return axiosErr?.response?.data?.errors ?? {};
}

function MegaphoneIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="m3 11 18-5v12L3 14v-3z" />
            <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
    );
}

function ClipboardIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" />
            <path d="M9 12h6M9 16h4" />
        </svg>
    );
}

function PlusIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M6 6l12 12M18 6L6 18" />
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <rect x="3" y="4.5" width="18" height="16" rx="2" />
            <path d="M3 9h18M8 2.5v4M16 2.5v4" />
        </svg>
    );
}

function EmptyState({ icon, hint, children }: { icon: ReactNode; hint: string; children: ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-base/30 px-4 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-ink/10 to-ink/[0.02] text-muted ring-1 ring-inset ring-border">
                {icon}
            </span>
            <p className="mt-3 text-sm font-semibold text-ink2">{children}</p>
            <p className="mt-0.5 text-xs text-muted">{hint}</p>
        </div>
    );
}

function Panel({
    icon,
    iconClass,
    pillClass,
    hairline,
    title,
    subtitle,
    count,
    action,
    children,
}: {
    icon: ReactNode;
    iconClass: string;
    pillClass: string;
    hairline: string;
    title: string;
    subtitle: string;
    count: number;
    action: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            <span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${hairline}`}
            />
            <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ${iconClass}`}
                    >
                        {icon}
                    </span>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="truncate font-display text-base font-semibold text-ink2">
                                {title}
                            </h2>
                            <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${pillClass}`}
                            >
                                {count}
                            </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>
                    </div>
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </header>
            <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:p-5">{children}</div>
        </section>
    );
}

function RowAction({
    label,
    onClick,
    tone = 'neutral',
}: {
    label: string;
    onClick: () => void;
    tone?: 'neutral' | 'danger';
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
                tone === 'danger'
                    ? 'text-danger hover:bg-danger/10'
                    : 'text-ink2 hover:bg-ink/5'
            }`}
        >
            {label}
        </button>
    );
}

const emptyNoticeForm = { class_id: '', title: '', description: '' };

const emptyTaskForm = () => ({
    class_id: '',
    subject_id: '',
    title: '',
    description: '',
    assigned_date: localYmd(new Date()),
    due_date: '',
});

interface NoticesTasksProps {
    announcements: Announcement[];
    homeworks: Homework[];
    onChanged?: () => void;
}

export default function NoticesTasks({ announcements, homeworks, onChanged }: NoticesTasksProps) {
    const { user } = useAuth();
    const isAdmin = user?.role === 'management';
    const isTeacher = user?.role === 'teacher';
    const canManage = isAdmin || isTeacher;

    const [classes, setClasses] = useState<ClassSummary[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teacherId, setTeacherId] = useState<number | null>(null);

    const [noticeOpen, setNoticeOpen] = useState(false);
    const [noticeEditId, setNoticeEditId] = useState<number | null>(null);
    const [noticeForm, setNoticeForm] = useState(emptyNoticeForm);

    const [taskOpen, setTaskOpen] = useState(false);
    const [taskEditId, setTaskEditId] = useState<number | null>(null);
    const [taskForm, setTaskForm] = useState(emptyTaskForm);

    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!canManage) return;
        if (isAdmin) {
            Promise.all([getClasses(), getSubjects()])
                .then(([classesRes, subjectsRes]) => {
                    setClasses(classesRes.data.classes);
                    setSubjects(subjectsRes.data.subjects);
                })
                .catch(() => setError("Couldn't load classes/subjects."));
            return;
        }
        getTeacherMe()
            .then((me) => {
                setTeacherId(me.data.id);
                return getTeacherSubjects(me.data.id);
            })
            .then((res) => {
                const subs = res.data.subjects;
                setSubjects(subs);
                const map = new Map<number, ClassSummary>();
                subs.forEach((s) => {
                    map.set(
                        s.classId,
                        s.class ?? { id: s.classId, class_name: `Class ${s.classId}` },
                    );
                });
                setClasses(Array.from(map.values()));
            })
            .catch(() => {});
    }, [canManage, isAdmin]);

    const today = localYmd(new Date());
    const fieldError = (key: string) => errors[key]?.[0];

    const taskSubjectOptions = useMemo(
        () => subjects.filter((s) => s.classId === Number(taskForm.class_id)),
        [subjects, taskForm.class_id],
    );

    const openAddNotice = () => {
        setNoticeEditId(null);
        setNoticeForm(emptyNoticeForm);
        setErrors({});
        setNoticeOpen(true);
    };

    const openEditNotice = (a: Announcement) => {
        setNoticeEditId(a.id);
        setNoticeForm({
            class_id: a.class_id === null ? '' : String(a.class_id),
            title: a.title,
            description: a.description ?? '',
        });
        setErrors({});
        setNoticeOpen(true);
    };

    const closeNotice = () => {
        setNoticeOpen(false);
        setNoticeEditId(null);
        setNoticeForm(emptyNoticeForm);
        setErrors({});
    };

    const openAddTask = () => {
        setTaskEditId(null);
        setTaskForm(emptyTaskForm());
        setErrors({});
        setTaskOpen(true);
    };

    const openEditTask = (hw: Homework) => {
        setTaskEditId(hw.id);
        setTaskForm({
            class_id: String(hw.class_id),
            subject_id: String(hw.subject_id),
            title: hw.title,
            description: hw.description ?? '',
            assigned_date: (hw.assigned_date ?? '').slice(0, 10),
            due_date: (hw.due_date ?? '').slice(0, 10),
        });
        setErrors({});
        setTaskOpen(true);
    };

    const closeTask = () => {
        setTaskOpen(false);
        setTaskEditId(null);
        setTaskForm(emptyTaskForm());
        setErrors({});
    };

    const submitNotice = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        setError(null);
        const payload = {
            class_id: noticeForm.class_id ? Number(noticeForm.class_id) : null,
            title: noticeForm.title,
            description: noticeForm.description || null,
        };
        try {
            if (noticeEditId) {
                await updateAnnouncement(noticeEditId, payload);
            } else {
                await createAnnouncement(payload);
            }
            closeNotice();
            onChanged?.();
        } catch (err: unknown) {
            const fieldErrors = extractErrors(err);
            if (Object.keys(fieldErrors).length === 0) setError('Failed to save notice.');
            setErrors(fieldErrors);
        } finally {
            setSaving(false);
        }
    };

    const deleteNotice = async (id: number) => {
        if (!confirm('Delete this notice?')) return;
        try {
            await deleteAnnouncement(id);
            onChanged?.();
        } catch {
            alert('Failed to delete notice.');
        }
    };

    const submitTask = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        setError(null);
        const payload = {
            class_id: Number(taskForm.class_id),
            subject_id: Number(taskForm.subject_id),
            title: taskForm.title,
            description: taskForm.description || null,
            assigned_date: taskForm.assigned_date,
            due_date: taskForm.due_date,
        };
        try {
            if (taskEditId) {
                await updateHomework(taskEditId, payload);
            } else {
                await createHomework(payload);
            }
            closeTask();
            onChanged?.();
        } catch (err: unknown) {
            const fieldErrors = extractErrors(err);
            if (Object.keys(fieldErrors).length === 0) setError('Failed to save homework.');
            setErrors(fieldErrors);
        } finally {
            setSaving(false);
        }
    };

    const deleteTask = async (id: number) => {
        if (!confirm('Delete this homework?')) return;
        try {
            await deleteHomework(id);
            onChanged?.();
        } catch {
            alert('Failed to delete homework.');
        }
    };

    const canTouchTask = (hw: Homework) =>
        isAdmin || (isTeacher && teacherId !== null && hw.assigned_by === teacherId);

    return (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
            <Panel
                icon={<MegaphoneIcon />}
                iconClass="bg-gradient-to-br from-gold/25 to-gold/5 text-gold-dark ring-gold/20"
                pillClass="bg-gold-50 text-gold-dark"
                hairline="from-transparent via-gold/40 to-transparent"
                title="Notices"
                subtitle="Announcements for classes and everyone"
                count={announcements.length}
                action={
                    canManage &&
                    !noticeOpen && (
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={openAddNotice}
                        >
                            <PlusIcon /> Add notice
                        </Button>
                    )
                }
            >
                {error && (
                    <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
                        {error}
                    </p>
                )}

                {noticeOpen && (
                    <form
                        onSubmit={submitNotice}
                        className="space-y-4 rounded-2xl border border-gold/25 bg-gradient-to-b from-gold-50/70 to-base/20 p-4 sm:p-5"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="font-display text-sm font-semibold text-ink2">
                                    {noticeEditId ? 'Edit notice' : 'New notice'}
                                </p>
                                <p className="text-xs text-muted">
                                    Visible to the selected audience on their dashboard.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeNotice}
                                aria-label="Close"
                                className="rounded-lg p-1.5 text-muted transition hover:bg-ink/5 hover:text-ink2"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <label className="flex flex-col gap-1.5 text-sm">
                                <span className="font-medium text-ink2">Audience</span>
                                <select
                                    value={noticeForm.class_id}
                                    onChange={(e) =>
                                        setNoticeForm((f) => ({ ...f, class_id: e.target.value }))
                                    }
                                    className="input"
                                >
                                    <option value="">All classes (general)</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.class_name}
                                            {c.section ? ` — ${c.section}` : ''}
                                        </option>
                                    ))}
                                </select>
                                {fieldError('class_id') && (
                                    <span className="text-xs text-danger">
                                        {fieldError('class_id')}
                                    </span>
                                )}
                            </label>
                            <label className="flex flex-col gap-1.5 text-sm">
                                <span className="font-medium text-ink2">Title</span>
                                <input
                                    type="text"
                                    value={noticeForm.title}
                                    onChange={(e) =>
                                        setNoticeForm((f) => ({ ...f, title: e.target.value }))
                                    }
                                    placeholder="e.g. Parent-teacher meeting"
                                    className="input"
                                />
                                {fieldError('title') && (
                                    <span className="text-xs text-danger">
                                        {fieldError('title')}
                                    </span>
                                )}
                            </label>
                        </div>
                        <label className="flex flex-col gap-1.5 text-sm">
                            <span className="font-medium text-ink2">Description (optional)</span>
                            <textarea
                                value={noticeForm.description}
                                onChange={(e) =>
                                    setNoticeForm((f) => ({ ...f, description: e.target.value }))
                                }
                                rows={3}
                                className="input resize-none"
                            />
                        </label>
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={closeNotice}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" size="sm" disabled={saving}>
                                {saving
                                    ? 'Saving...'
                                    : noticeEditId
                                      ? 'Save changes'
                                      : 'Post notice'}
                            </Button>
                        </div>
                    </form>
                )}

                {announcements.length === 0 ? (
                    <EmptyState icon={<MegaphoneIcon />} hint="Post one to keep everyone in the loop.">
                        No notices yet
                    </EmptyState>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {announcements.map((a) => (
                            <li
                                key={a.id}
                                className="group flex items-start gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
                            >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold-dark">
                                    <MegaphoneIcon />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-ink2">
                                        {a.title}
                                    </p>
                                    {a.description && (
                                        <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                                            {a.description}
                                        </p>
                                    )}
                                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
                                        <span className="inline-flex items-center gap-1.5 font-medium text-ink2/80">
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink font-display text-[10px] font-bold text-gold-light">
                                                {initial(a.poster?.name)}
                                            </span>
                                            {a.poster?.name ?? 'Administration'}
                                        </span>
                                        <span className="text-border">•</span>
                                        <span className="inline-flex items-center rounded-full bg-base px-2 py-0.5 font-medium text-ink2/80 ring-1 ring-inset ring-border">
                                            {a.class ? a.class.class_name : 'Everyone'}
                                        </span>
                                        <span className="text-border">•</span>
                                        <span className="data-figure">
                                            {formatShortDate(a.created_at)}
                                        </span>
                                    </div>
                                </div>
                                {canManage && (
                                    <div className="flex shrink-0 gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                                        <RowAction
                                            label="Edit"
                                            onClick={() => openEditNotice(a)}
                                        />
                                        <RowAction
                                            label="Delete"
                                            tone="danger"
                                            onClick={() => deleteNotice(a.id)}
                                        />
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>

            <Panel
                icon={<ClipboardIcon />}
                iconClass="bg-gradient-to-br from-ink/15 to-ink/5 text-ink ring-ink/15"
                pillClass="bg-ink-50 text-ink"
                hairline="from-transparent via-ink/25 to-transparent"
                title="Tasks & Deadlines"
                subtitle="Homework and due dates for your classes"
                count={homeworks.length}
                action={
                    canManage &&
                    !taskOpen && (
                        <Button type="button" size="sm" variant="secondary" onClick={openAddTask}>
                            <PlusIcon /> Assign task
                        </Button>
                    )
                }
            >
                {taskOpen && (
                    <form
                        onSubmit={submitTask}
                        className="space-y-4 rounded-2xl border border-ink/15 bg-gradient-to-b from-ink-50/80 to-base/20 p-4 sm:p-5"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="font-display text-sm font-semibold text-ink2">
                                    {taskEditId ? 'Edit task' : 'New task'}
                                </p>
                                <p className="text-xs text-muted">
                                    Assign homework with a due date for a class.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeTask}
                                aria-label="Close"
                                className="rounded-lg p-1.5 text-muted transition hover:bg-ink/5 hover:text-ink2"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <label className="flex flex-col gap-1.5 text-sm">
                                <span className="font-medium text-ink2">Class</span>
                                <select
                                    value={taskForm.class_id}
                                    onChange={(e) =>
                                        setTaskForm((f) => ({
                                            ...f,
                                            class_id: e.target.value,
                                            subject_id: '',
                                        }))
                                    }
                                    className="input"
                                >
                                    <option value="">Select a class</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.class_name}
                                            {c.section ? ` — ${c.section}` : ''}
                                        </option>
                                    ))}
                                </select>
                                {fieldError('class_id') && (
                                    <span className="text-xs text-danger">
                                        {fieldError('class_id')}
                                    </span>
                                )}
                            </label>
                            <label className="flex flex-col gap-1.5 text-sm">
                                <span className="font-medium text-ink2">Subject</span>
                                <select
                                    value={taskForm.subject_id}
                                    onChange={(e) =>
                                        setTaskForm((f) => ({
                                            ...f,
                                            subject_id: e.target.value,
                                        }))
                                    }
                                    disabled={!taskForm.class_id}
                                    className="input disabled:opacity-50"
                                >
                                    <option value="">Select a subject</option>
                                    {taskSubjectOptions.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.subjectName}
                                        </option>
                                    ))}
                                </select>
                                {fieldError('subject_id') && (
                                    <span className="text-xs text-danger">
                                        {fieldError('subject_id')}
                                    </span>
                                )}
                            </label>
                        </div>
                        <label className="flex flex-col gap-1.5 text-sm">
                            <span className="font-medium text-ink2">Title</span>
                            <input
                                type="text"
                                value={taskForm.title}
                                onChange={(e) =>
                                    setTaskForm((f) => ({ ...f, title: e.target.value }))
                                }
                                placeholder="e.g. Chapter 5 exercises"
                                className="input"
                            />
                            {fieldError('title') && (
                                <span className="text-xs text-danger">{fieldError('title')}</span>
                            )}
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm">
                            <span className="font-medium text-ink2">Description (optional)</span>
                            <textarea
                                value={taskForm.description}
                                onChange={(e) =>
                                    setTaskForm((f) => ({ ...f, description: e.target.value }))
                                }
                                rows={3}
                                className="input resize-none"
                            />
                        </label>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <label className="flex flex-col gap-1.5 text-sm">
                                <span className="font-medium text-ink2">Assigned date</span>
                                <input
                                    type="date"
                                    value={taskForm.assigned_date}
                                    onChange={(e) =>
                                        setTaskForm((f) => ({
                                            ...f,
                                            assigned_date: e.target.value,
                                        }))
                                    }
                                    className="input"
                                />
                            </label>
                            <label className="flex flex-col gap-1.5 text-sm">
                                <span className="font-medium text-ink2">Due date</span>
                                <input
                                    type="date"
                                    value={taskForm.due_date}
                                    onChange={(e) =>
                                        setTaskForm((f) => ({ ...f, due_date: e.target.value }))
                                    }
                                    className="input"
                                />
                                {fieldError('due_date') && (
                                    <span className="text-xs text-danger">
                                        {fieldError('due_date')}
                                    </span>
                                )}
                            </label>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={closeTask}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" size="sm" disabled={saving}>
                                {saving
                                    ? 'Saving...'
                                    : taskEditId
                                      ? 'Save changes'
                                      : 'Assign task'}
                            </Button>
                        </div>
                    </form>
                )}

                {homeworks.length === 0 ? (
                    <EmptyState icon={<ClipboardIcon />} hint="Assigned homework appears here with its deadline.">
                        No tasks assigned yet
                    </EmptyState>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {homeworks.map((hw) => {
                            const dueDay = (hw.due_date ?? '').slice(0, 10);
                            const overdue = dueDay !== '' && dueDay < today;
                            const dueToday = dueDay === today;
                            const dateChip = overdue
                                ? 'bg-danger/10 text-danger ring-danger/20'
                                : dueToday
                                  ? 'bg-warning/10 text-warning ring-warning/25'
                                  : 'bg-base text-ink2 ring-border';
                            return (
                                <li
                                    key={hw.id}
                                    className="group flex items-start gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
                                >
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink/10 text-ink">
                                        <ClipboardIcon />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-ink2">
                                            {hw.title}
                                        </p>
                                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
                                            <span className="font-medium text-ink2/80">
                                                {hw.subject?.subjectName ?? 'Subject'}
                                            </span>
                                            {classLabel(hw) && (
                                                <>
                                                    <span className="text-border">•</span>
                                                    <span>{classLabel(hw)}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        {overdue ? (
                                            <StatusBadge status="danger">Overdue</StatusBadge>
                                        ) : dueToday ? (
                                            <StatusBadge status="warning">Due today</StatusBadge>
                                        ) : null}
                                        <span
                                            className={`data-figure inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ring-1 ring-inset ${dateChip}`}
                                        >
                                            <CalendarIcon />
                                            {formatShortDate(hw.due_date)}
                                        </span>
                                        {canTouchTask(hw) && (
                                            <div className="flex gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                                                <RowAction
                                                    label="Edit"
                                                    onClick={() => openEditTask(hw)}
                                                />
                                                <RowAction
                                                    label="Delete"
                                                    tone="danger"
                                                    onClick={() => deleteTask(hw.id)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Panel>
        </div>
    );
}
