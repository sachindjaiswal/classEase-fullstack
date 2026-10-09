import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import type { Role, User } from '@/types';
import api from '@/api/axios';

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (
        name: string,
        email: string,
        password: string,
        password_confirmation: string,
        tenant_slug: string,
    ) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapRole(backendRole: string): Role | null {
    if (backendRole === 'admin') return 'management';
    if (backendRole === 'platform_admin') return 'platform';
    if (
        backendRole === 'management' ||
        backendRole === 'teacher' ||
        backendRole === 'student'
    )
        return backendRole as Role;
    return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setLoading(false);
            return;
        }
        api.get('/me')
            .then((res) => {
                const bUser = res.data.user;
                const role = mapRole(bUser.role);
                if (role) {
                    setUser({ id: bUser.id, name: bUser.name, email: bUser.email, role });
                } else {
                    localStorage.removeItem('authToken');
                }
            })
            .catch(() => {
                localStorage.removeItem('authToken');
            })
            .finally(() => setLoading(false));
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const res = await api.post('/login', { email, password });
        const { user: bUser, token } = res.data;
        localStorage.setItem('authToken', token);
        const role = mapRole(bUser.role);
        if (!role) throw new Error('Unknown user role');
        setUser({ id: bUser.id, name: bUser.name, email: bUser.email, role });
    }, []);

    const register = useCallback(
        async (
            name: string,
            email: string,
            password: string,
            password_confirmation: string,
            tenant_slug: string,
        ) => {
            const res = await api.post('/register', {
                name,
                email,
                password,
                password_confirmation,
                tenant_slug,
            });
            const { user: bUser, token } = res.data;
            localStorage.setItem('authToken', token);
            const mappedRole = mapRole(bUser.role);
            if (!mappedRole) throw new Error('Unknown user role');
            setUser({ id: bUser.id, name: bUser.name, email: bUser.email, role: mappedRole });
        },
        [],
    );

    const logout = useCallback(async () => {
        try {
            await api.post('/logout');
        } catch {
            /* clear local state regardless */
        }
        localStorage.removeItem('authToken');
        setUser(null);
    }, []);

    const value = useMemo(
        () => ({ user, loading, login, register, logout }),
        [user, loading, login, register, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
