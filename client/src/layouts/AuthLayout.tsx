import type { ReactNode } from 'react';

const FEATURES = [
    'One calm home for every school you run',
    'Live attendance, scores and performance',
    'Homework, notices and concerns in sync',
];

function Check() {
    return (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-light ring-1 ring-inset ring-gold/25">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M20 6 9 17l-5-5" />
            </svg>
        </span>
    );
}

export default function AuthLayout({
    eyebrow,
    subtitle,
    footer,
    children,
}: {
    eyebrow: string;
    subtitle: string;
    footer?: ReactNode;
    children: ReactNode;
}) {
    return (
        <div className="flex min-h-screen w-full bg-ink">
            {/* Brand panel — desktop */}
            <aside className="relative hidden w-[46%] max-w-[560px] flex-col justify-between overflow-hidden p-12 lg:flex">
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(45rem 32rem at 10% -10%, rgba(200,155,60,0.20), transparent 55%), radial-gradient(40rem 30rem at 110% 115%, rgba(46,155,154,0.16), transparent 55%), linear-gradient(160deg, #1E2A4A 0%, #16213B 55%, #0F1830 100%)',
                    }}
                />
                <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full border border-gold/15" />
                <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full border border-teal/15" />

                <div className="relative z-10 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-light via-gold to-gold-dark font-display text-sm font-bold text-ink shadow-soft">
                        CE
                    </div>
                    <span className="font-display text-xl font-semibold tracking-tight text-white">
                        ClassEase
                    </span>
                </div>

                <div className="relative z-10 max-w-md">
                    <h2 className="font-display text-[2rem] font-bold leading-tight tracking-tight text-white">
                        Run your school with clarity and ease.
                    </h2>
                    <p className="mt-4 text-sm leading-relaxed text-white/60">
                        Students, teachers, attendance, scores and communication — all in one
                        calm, focused place.
                    </p>
                    <ul className="mt-9 flex flex-col gap-4">
                        {FEATURES.map((f) => (
                            <li key={f} className="flex items-center gap-3 text-sm text-white/80">
                                <Check />
                                {f}
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative z-10 text-xs text-white/35">
                    © {new Date().getFullYear()} ClassEase
                </p>
            </aside>

            {/* Form panel */}
            <main className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
                <div
                    className="pointer-events-none absolute inset-0 lg:hidden"
                    style={{
                        background:
                            'radial-gradient(40rem 30rem at 15% -10%, rgba(200,155,60,0.18), transparent 55%), radial-gradient(36rem 26rem at 110% 115%, rgba(46,155,154,0.14), transparent 55%)',
                    }}
                />
                <div className="relative w-full max-w-sm animate-fade-up">
                    <div className="rounded-3xl border border-border bg-surface p-6 shadow-pop sm:p-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-light via-gold to-gold-dark font-display text-base font-bold tracking-tight text-ink shadow-soft">
                                CE
                            </div>
                            <div>
                                <h1 className="font-display text-xl font-semibold text-ink2">
                                    ClassEase
                                </h1>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                                    {eyebrow}
                                </p>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-muted">{subtitle}</p>
                        <div className="mt-6">{children}</div>
                    </div>
                    {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
                </div>
            </main>
        </div>
    );
}
