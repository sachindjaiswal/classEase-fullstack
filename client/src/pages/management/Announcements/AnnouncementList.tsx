import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getClasses } from '@/api/classes';
import { getAnnouncements, getAnnouncementsByClass, deleteAnnouncement } from '@/api/announcements';
import type { SchoolClass, Announcement } from '@/types';
import Button from '@/components/Button';

export default function AnnouncementList() {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [audience, setAudience] = useState('all');
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        getClasses()
            .then((res) => setClasses(res.data.classes))
            .catch(() => {});
    }, []);

    useEffect(() => {
        setLoading(true);
        setError(null);
        const request =
            audience === 'all'
                ? getAnnouncements()
                : getAnnouncementsByClass(Number(audience));
        request
            .then((res) => setAnnouncements(res.data.announcements))
            .catch(() => setError("Couldn't load announcements."))
            .finally(() => setLoading(false));
    }, [audience]);

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this announcement?')) return;
        try {
            await deleteAnnouncement(id);
            setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        } catch {
            alert('Failed to delete announcement.');
        }
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        return `${d.toLocaleDateString()}, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
    };

    return (
        <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-ink2">Announcements</h1>
                    <p className="mt-1 text-sm text-muted">
                        Post announcements to a class or everyone
                    </p>
                </div>
                <Link to="/management/announcements/new">
                    <Button>Add Announcement</Button>
                </Link>
            </div>

            <label className="mt-6 flex max-w-xs flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink2">Audience</span>
                <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-ink"
                >
                    <option value="all">All announcements</option>
                    {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.class_name} — {c.section}
                        </option>
                    ))}
                </select>
            </label>

            <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
                {loading && <p className="p-6 text-sm text-muted">Loading announcements...</p>}
                {error && <p className="p-6 text-sm text-danger">{error}</p>}

                {!loading && !error && announcements.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-ink2">No announcements</p>
                        <p className="mt-1 text-sm text-muted">
                            Post an announcement to get started.
                        </p>
                    </div>
                )}

                {!loading && !error && announcements.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-base text-xs uppercase tracking-wide text-muted">
                                <tr>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Title</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Audience</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Posted by</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium">Date</th>
                                    <th className="whitespace-nowrap px-5 py-3 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {announcements.map((a) => (
                                    <tr key={a.id} className="hover:bg-base/60">
                                        <td className="whitespace-nowrap px-5 py-3">
                                            <p className="font-medium text-ink2">{a.title}</p>
                                            {a.description && (
                                                <p className="mt-0.5 max-w-sm truncate text-xs text-muted">
                                                    {a.description}
                                                </p>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-muted">
                                            {a.class ? a.class.class_name : 'All classes'}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-muted">
                                            {a.poster?.name ?? '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-muted">
                                            {formatDate(a.created_at)}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-right">
                                            <button
                                                onClick={() =>
                                                    navigate(`/management/announcements/${a.id}/edit`, {
                                                        state: { announcement: a },
                                                    })
                                                }
                                                className="mr-4 text-sm font-medium text-ink hover:underline"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(a.id)}
                                                className="text-sm font-medium text-danger hover:underline"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}