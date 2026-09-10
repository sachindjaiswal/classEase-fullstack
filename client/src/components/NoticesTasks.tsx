import StatusBadge from '@/components/StatusBadge';
import type { Announcement, Homework } from '@/types';

function localYmd(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function classLabel(homework: { class?: { class_name?: string; section?: string } | null }): string | null {
  if (!homework.class) return null;
  return `${homework.class.class_name} — ${homework.class.section}`;
}

export default function NoticesTasks({
  announcements,
  homeworks,
}: {
  announcements: Announcement[];
  homeworks: Homework[];
}) {
  const today = localYmd(new Date());

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-medium text-muted">Notices ({announcements.length})</h2>
        {announcements.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No notices yet.</p>
        ) : (
          <div className="mt-3 divide-y divide-border">
            {announcements.map((a) => (
              <div key={a.id} className="py-2">
                <p className="text-sm font-medium text-ink2">{a.title}</p>
                {a.description && (
                  <p className="mt-0.5 text-sm text-muted">{a.description}</p>
                )}
                <p className="mt-0.5 text-xs text-muted">
                  {a.poster?.name ?? 'Administration'}
                  {a.class ? ` — ${a.class.class_name}` : ' — Everyone'} •{' '}
                  {new Date(a.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-sm font-medium text-muted">
          Tasks &amp; Deadlines ({homeworks.length})
        </h2>
        {homeworks.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No tasks assigned yet.</p>
        ) : (
          <div className="mt-3 divide-y divide-border">
            {homeworks.map((hw) => {
              const dueDay = (hw.due_date ?? '').slice(0, 10);
              const overdue = dueDay !== '' && dueDay < today;
              const dueToday = dueDay === today;
              return (
                <div key={hw.id} className="flex items-start justify-between gap-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-ink2">{hw.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {hw.subject?.subjectName ?? 'Subject'}
                      {classLabel(hw) ? ` — ${classLabel(hw)}` : ''} • Due{' '}
                      {new Date(hw.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  {overdue ? (
                    <StatusBadge status="danger">Overdue</StatusBadge>
                  ) : dueToday ? (
                    <StatusBadge status="warning">Due today</StatusBadge>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}