import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const LINKS: Record<string, { to: string; label: string }[]> = {
    management: [
        { to: '/management/dashboard', label: 'Dashboard' },
        { to: '/management/students', label: 'Students' },
        { to: '/management/teachers', label: 'Teachers' },
        { to: '/management/classes', label: 'Classes' },
        { to: '/management/subjects', label: 'Subjects' },
        { to: '/management/timetable', label: 'Timetable' },
        { to: '/management/attendance', label: 'Attendance' },
        { to: '/management/homework', label: 'Homework' },
        { to: '/management/scores', label: 'Scores' },
        { to: '/management/leaderboard', label: 'Leaderboard' },
        { to: '/management/announcements', label: 'Announcements' },
        { to: '/management/concerns', label: 'Concerns' },
        { to: '/management/performance', label: 'Performance' },
    ],
    teacher: [
        { to: '/teacher/dashboard', label: 'Dashboard' },
        { to: '/teacher/scores', label: 'Marks' },
        { to: '/teacher/attendance', label: 'Attendance' },
        { to: '/teacher/homework', label: 'Homework' },
        { to: '/teacher/timetable', label: 'Timetable' },
        { to: '/teacher/announcements', label: 'Announcements' },
        { to: '/teacher/concerns', label: 'Concerns' },
        { to: '/teacher/performance', label: 'Performance' },
    ],
    student: [
        { to: '/student/dashboard', label: 'Dashboard' },
        { to: '/student/timetable', label: 'Timetable' },
        { to: '/student/performance', label: 'Performance' },
        { to: '/student/concerns', label: 'Concerns' },
    ],
};

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
    const { user, logout } = useAuth();
    if (!user) return null;
    const links = LINKS[user.role] ?? [];

    const handleNavClick = () => onClose();

    return (
        <>
            {/* Backdrop — mobile only */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 flex w-60 flex-col justify-between bg-ink text-white transition-transform duration-200
                    md:static md:translate-x-0
                    ${open ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div>
                    <div className="flex items-center justify-between px-5 py-6">
                        <div>
                            <h1 className="font-display text-xl font-semibold tracking-tight">
                                ClassEase
                            </h1>
                            <p className="mt-0.5 text-xs uppercase tracking-wide text-white/50">
                                {user.role}
                            </p>
                        </div>
                        {/* Close button — mobile only */}
                        <button
                            onClick={onClose}
                            className="rounded-md p-1 text-white/50 hover:text-white md:hidden"
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
                    <nav className="flex flex-col gap-0.5 px-3">
                        {links.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                onClick={handleNavClick}
                                className={({ isActive }) =>
                                    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                        isActive
                                            ? 'bg-white/10 text-white'
                                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                                    }`
                                }
                            >
                                {link.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="border-t border-white/10 p-4">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-white/50">{user.email}</p>
                    <button
                        onClick={logout}
                        className="mt-3 text-sm font-medium text-gold hover:text-gold-light"
                    >
                        Log out
                    </button>
                </div>
            </aside>
        </>
    );
}
