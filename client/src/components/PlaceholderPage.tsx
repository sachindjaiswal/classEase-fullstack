export default function PlaceholderPage({
  title,
  note,
}: {
  title: string;
  note?: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink2">{title}</h1>
      <div className="mt-6 rounded-lg border border-dashed border-border bg-surface p-10 text-center">
        <p className="text-sm font-medium text-ink2">Not built yet</p>
        <p className="mt-1 text-sm text-muted">
          {note ?? 'This screen is scaffolded and routed — build it next.'}
        </p>
      </div>
    </div>
  );
}
