'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authAPI, emailsAPI } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, fullName?: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('mailmind_token');
        if (storedToken) {
          setToken(storedToken);
          try {
            const me = await authAPI.getMe();
            setUser(me);
          } catch {
            localStorage.removeItem('mailmind_token');
            setToken(null);
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', pass);
    const res = await authAPI.login(formData);
    localStorage.setItem('mailmind_token', res.access_token);
    setToken(res.access_token);
    const me = await authAPI.getMe();
    setUser(me);
  };

  const register = async (email: string, pass: string, fullName?: string) => {
    await authAPI.register({ email, password: pass, full_name: fullName });
    await login(email, pass);
  };

  const loginAsGuest = async () => {
    const guestEmail = `guest_${Math.floor(Math.random() * 10000)}@mailmind.ai`;
    const guestPass = 'MailMind123!';
    try {
      await register(guestEmail, guestPass, 'Alex Mercer (Demo)');
      // Auto seed demo emails for instant rich experience
      try {
        await emailsAPI.seedDemo();
      } catch {
        // Ignored if seeder already seeded
      }
    } catch {
      // Fallback to default demo user
      try {
        await login('demo@mailmind.ai', 'password123');
      } catch {
        // ignore
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('mailmind_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
