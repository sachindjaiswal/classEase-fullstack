import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Role, User } from '@/types';
import api from '@/api/axios';

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, password_confirmation: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapRole(backendRole: string): Role | null {
    if (backendRole === 'admin') return 'management';
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

    const login = async (email: string, password: string) => {
        const res = await api.post('/login', { email, password });
        const { user: bUser, token } = res.data;
        localStorage.setItem('authToken', token);
        const role = mapRole(bUser.role);
        if (!role) throw new Error('Unknown user role');
        setUser({ id: bUser.id, name: bUser.name, email: bUser.email, role });
    };

    const register = async (name: string, email: string, password: string, password_confirmation: string) => {
        const res = await api.post('/register', { name, email, password, password_confirmation });
        const { user: bUser, token } = res.data;
        localStorage.setItem('authToken', token);
        const mappedRole = mapRole(bUser.role);
        if (!mappedRole) throw new Error('Unknown user role');
        setUser({ id: bUser.id, name: bUser.name, email: bUser.email, role: mappedRole });
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch {
            /* clear local state regardless */
        }
        localStorage.removeItem('authToken');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
