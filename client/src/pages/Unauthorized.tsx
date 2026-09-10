import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-2 bg-base">
      <h1 className="font-display text-xl font-semibold text-ink2">Access denied</h1>
      <p className="text-sm text-muted">You don't have permission to view this page.</p>
      <Link to="/login" className="mt-2 text-sm font-medium text-ink hover:underline">
        Back to login
      </Link>
    </div>
  );
}
