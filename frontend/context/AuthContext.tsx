'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
// import { jwtDecode } from 'jwt-decode'; // Not strictly needed if we store user info
import { useRouter } from 'next/navigation';

interface User {
    id: number;
    name: string;
    role: 'OWNER' | 'STUDENT';
    mobile: string;
}

interface AuthContextType {
    user: User | null;
    login: (token: string, userData: User) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Try to fetch user data from API (verifies HttpOnly cookie)
                const { data } = await import('../lib/api').then(mod => mod.default.get('/auth/me'));
                setUser(data);
                localStorage.setItem('user', JSON.stringify(data));
            } catch (error) {
                // If 401/403, clear local storage
                console.error("Session verification failed", error);
                Cookies.remove('token');
                localStorage.removeItem('user');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = (token: string, userData: User) => {
        Cookies.set('token', token, { expires: 30 });
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        if (userData.role === 'OWNER') {
            router.push('/owner');
        } else {
            router.push('/student');
        }
    };

    const logout = () => {
        Cookies.remove('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
