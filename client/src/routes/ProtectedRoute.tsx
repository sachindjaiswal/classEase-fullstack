import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types';

interface Props {
    allow: Role[];
}

export default function ProtectedRoute({ allow }: Props) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-base">
                <p className="text-sm text-muted">Loading…</p>
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;
    if (!allow.includes(user.role)) return <Navigate to="/unauthorized" replace />;

    return <Outlet />;
}
