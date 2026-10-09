import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';

function prettify(segment: string): string {
    return segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function initials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const { user } = useAuth();

    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    const openSidebar = useCallback(() => setSidebarOpen(true), []);
    const closeSidebar = useCallback(() => setSidebarOpen(false), []);

    const crumbs = useMemo(
        () => location.pathname.split('/').filter(Boolean).slice(1).map(prettify),
        [location.pathname],
    );

    const today = useMemo(
        () =>
            new Date().toLocaleDateString(undefined, {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }),
        [],
    );

    return (
        <div className="flex h-screen w-full overflow-hidden">
            <Sidebar open={sidebarOpen} onClose={closeSidebar} />

            <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-transparent">
                {/* Top bar */}
                <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border/70 bg-surface/85 px-4 py-3 backdrop-blur-md md:px-8">
                    <div className="flex min-w-0 items-center gap-3">
                        <button
                            onClick={openSidebar}
                            className="rounded-lg p-1.5 text-ink2 transition hover:bg-base md:hidden"
                            aria-label="Open sidebar"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>

                        <span className="font-display text-lg font-semibold text-ink2 md:hidden">
                            ClassEase
                        </span>

                        <nav className="hidden min-w-0 items-center gap-2 text-sm md:flex">
                            <span className="text-muted">
                                {user ? prettify(user.role) : ''}
                            </span>
                            {crumbs.length > 0 && (
                                <>
                                    <span className="text-border">/</span>
                                    <span className="truncate font-semibold text-ink2">
                                        {crumbs[crumbs.length - 1]}
                                    </span>
                                </>
                            )}
                        </nav>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden text-xs text-muted lg:block">
                            {today}
                        </span>
                        {user && (
                            <div className="flex items-center gap-2.5 rounded-full border border-border bg-white py-1 pl-1 pr-3 shadow-sm">
                                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink font-display text-[11px] font-bold text-gold-light">
                                    {initials(user.name)}
                                </span>
                                <span className="hidden leading-tight sm:block">
                                    <span className="block max-w-[10rem] truncate text-xs font-semibold text-ink2">
                                        {user.name}
                                    </span>
                                    <span className="block text-[10px] uppercase tracking-wide text-muted">
                                        {user.role}
                                    </span>
                                </span>
                            </div>
                        )}
                    </div>
                </header>

                <div className="mx-auto w-full max-w-7xl flex-1 animate-fade-in px-4 py-6 sm:px-6 sm:py-8 md:px-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
