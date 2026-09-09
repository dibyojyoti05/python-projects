'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { api } from './api';
import { useRouter } from 'next/navigation';

export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (tokens: { access: string; refresh: string }, user: User) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: () => {},
    logout: () => {},
    checkAuth: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const login = (tokens: { access: string; refresh: string }, userData: User) => {
        Cookies.set('access_token', tokens.access);
        Cookies.set('refresh_token', tokens.refresh);
        setUser(userData);
    };

    const logout = () => {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        setUser(null);
        router.push('/login');
    };

    const checkAuth = async () => {
        try {
            const token = Cookies.get('access_token');
            if (!token) {
                setIsLoading(false);
                return;
            }
            const res = await api.get('/auth/me/');
            setUser(res.data);
        } catch (error) {
            console.error("Auth check failed", error);
            Cookies.remove('access_token');
            Cookies.remove('refresh_token');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
