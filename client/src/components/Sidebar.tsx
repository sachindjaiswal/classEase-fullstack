import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

type IconKey =
    | 'dashboard'
    | 'institutions'
    | 'students'
    | 'teachers'
    | 'classes'
    | 'subjects'
    | 'timetable'
    | 'attendance'
    | 'appeals'
    | 'homework'
    | 'scores'
    | 'leaderboard'
    | 'announcements'
    | 'concerns'
    | 'performance';

const PATHS: Record<IconKey, ReactNode> = {
    dashboard: (
        <>
            <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
            <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
            <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
            <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
        </>
    ),
    institutions: (
        <>
            <path d="M4 21V8l8-5 8 5v13" />
            <path d="M9 21v-6h6v6" />
            <path d="M9 9h.01M15 9h.01M9 12.5h.01M15 12.5h.01" />
        </>
    ),
    students: (
        <>
            <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9.5" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
    ),
    teachers: (
        <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="m16 11 2 2 4-4" />
        </>
    ),
    classes: (
        <>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </>
    ),
    subjects: (
        <>
            <path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" />
            <path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" />
        </>
    ),
    timetable: (
        <>
            <rect x="3" y="4" width="18" height="18" rx="2.5" />
            <path d="M16 2v4M8 2v4M3 10h18" />
        </>
    ),
    attendance: (
        <>
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </>
    ),
    appeals: (
        <>
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-3-8-3-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
        </>
    ),
    homework: (
        <>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" />
            <path d="M9 12h6M9 16h4" />
        </>
    ),
    scores: (
        <>
            <line x1="6" y1="20" x2="6" y2="15" />
            <line x1="12" y1="20" x2="12" y2="9" />
            <line x1="18" y1="20" x2="18" y2="4" />
        </>
    ),
    leaderboard: (
        <>
            <circle cx="12" cy="8" r="5.5" />
            <path d="M15.5 12.5 17 22l-5-3-5 3 1.5-9.5" />
        </>
    ),
    announcements: (
        <>
            <path d="m3 11 18-5v12L3 14v-3z" />
            <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </>
    ),
    concerns: (
        <>
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13.5" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </>
    ),
    performance: (
        <>
            <path d="M23 6l-9.5 9.5-5-5L1 18" />
            <path d="M17 6h6v6" />
        </>
    ),
};

type NavItem = { to: string; label: string; icon: IconKey; end?: boolean };
type NavGroup = { heading?: string; items: NavItem[] };

const NAV: Record<string, NavGroup[]> = {
    platform: [{ items: [{ to: '/platform/dashboard', label: 'Dashboard', icon: 'dashboard' }, { to: '/platform/institutions', label: 'Institutions', icon: 'institutions' }] }],
    management: [
        { heading: 'Overview', items: [{ to: '/management/dashboard', label: 'Dashboard', icon: 'dashboard' }, { to: '/management/performance', label: 'Performance', icon: 'performance' }] },
        { heading: 'People', items: [{ to: '/management/students', label: 'Students', icon: 'students' }, { to: '/management/teachers', label: 'Teachers', icon: 'teachers' }] },
        {
            heading: 'Academics',
            items: [
                { to: '/management/classes', label: 'Classes', icon: 'classes' },
                { to: '/management/subjects', label: 'Subjects', icon: 'subjects' },
                { to: '/management/timetable', label: 'Timetable', icon: 'timetable' },
                { to: '/management/attendance', label: 'Attendance', icon: 'attendance', end: true },
                { to: '/management/attendance/appeals', label: 'Attendance Appeals', icon: 'appeals' },
                { to: '/management/homework', label: 'Homework', icon: 'homework' },
                { to: '/management/scores', label: 'Scores', icon: 'scores' },
                { to: '/management/leaderboard', label: 'Leaderboard', icon: 'leaderboard' },
            ],
        },
        { heading: 'Communication', items: [{ to: '/management/announcements', label: 'Announcements', icon: 'announcements' }, { to: '/management/concerns', label: 'Concerns', icon: 'concerns' }] },
    ],
    teacher: [
        { heading: 'Overview', items: [{ to: '/teacher/dashboard', label: 'Dashboard', icon: 'dashboard' }, { to: '/teacher/performance', label: 'Performance', icon: 'performance' }] },
        {
            heading: 'Academics',
            items: [
                { to: '/teacher/scores', label: 'Marks', icon: 'scores' },
                { to: '/teacher/attendance', label: 'Attendance', icon: 'attendance', end: true },
                { to: '/teacher/attendance/appeals', label: 'Attendance Appeals', icon: 'appeals' },
                { to: '/teacher/homework', label: 'Homework', icon: 'homework' },
                { to: '/teacher/timetable', label: 'Timetable', icon: 'timetable' },
            ],
        },
        { heading: 'Communication', items: [{ to: '/teacher/announcements', label: 'Announcements', icon: 'announcements' }, { to: '/teacher/concerns', label: 'Concerns', icon: 'concerns' }] },
    ],
    student: [
        {
            items: [
                { to: '/student/dashboard', label: 'Dashboard', icon: 'dashboard' },
                { to: '/student/timetable', label: 'Timetable', icon: 'timetable' },
                { to: '/student/attendance', label: 'Attendance', icon: 'attendance' },
                { to: '/student/performance', label: 'Performance', icon: 'performance' },
                { to: '/student/concerns', label: 'Concerns', icon: 'concerns' },
            ],
        },
    ],
};

function NavIcon({ icon }: { icon: IconKey }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-[18px] w-[18px] shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {PATHS[icon]}
        </svg>
    );
}

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
    const { user, logout } = useAuth();
    if (!user) return null;
    const groups = NAV[user.role] ?? [];

    const handleNavClick = () => onClose();

    return (
        <>
            {/* Backdrop — mobile only */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm md:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between bg-ink text-white transition-transform duration-200
                    md:static md:translate-x-0
                    ${open ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="flex items-center justify-between px-5 py-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-light via-gold to-gold-dark font-display text-sm font-bold text-ink shadow-soft">
                                CE
                            </div>
                            <div>
                                <h1 className="font-display text-xl font-semibold tracking-tight">
                                    ClassEase
                                </h1>
                                <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-white/45">
                                    {user.role}
                                </p>
                            </div>
                        </div>
                        {/* Close button — mobile only */}
                        <button
                            onClick={onClose}
                            className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white md:hidden"
                            aria-label="Close sidebar"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </div>

                    <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
                        {groups.map((group, gi) => (
                            <div key={group.heading ?? gi} className={gi > 0 ? 'mt-5' : ''}>
                                {group.heading && (
                                    <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                                        {group.heading}
                                    </p>
                                )}
                                <div className="flex flex-col gap-0.5">
                                    {group.items.map((link) => (
                                        <NavLink
                                            key={link.to}
                                            to={link.to}
                                            end={link.end}
                                            onClick={handleNavClick}
                                            className={({ isActive }) =>
                                                `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                                                    isActive
                                                        ? 'bg-white/10 text-white shadow-inner-top'
                                                        : 'text-white/65 hover:bg-white/5 hover:text-white'
                                                }`
                                            }
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    <span
                                                        className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-gold transition-opacity ${
                                                            isActive ? 'opacity-100' : 'opacity-0'
                                                        }`}
                                                    />
                                                    <span
                                                        className={
                                                            isActive
                                                                ? 'text-gold-light'
                                                                : 'text-white/45 transition-colors group-hover:text-white/75'
                                                        }
                                                    >
                                                        <NavIcon icon={link.icon} />
                                                    </span>
                                                    {link.label}
                                                </>
                                            )}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>
                </div>

                <div className="border-t border-white/10 p-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/20 to-white/5 font-display text-xs font-bold text-gold-light ring-1 ring-inset ring-white/10">
                            {user.name
                                .split(' ')
                                .map((part) => part[0])
                                .slice(0, 2)
                                .join('')
                                .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{user.name}</p>
                            <p className="truncate text-xs text-white/45">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="mt-3 w-full rounded-xl border border-gold/35 px-2 py-2 text-sm font-medium text-gold-light transition hover:border-gold/60 hover:bg-gold/10"
                    >
                        Log out
                    </button>
                </div>
            </aside>
        </>
    );
}
