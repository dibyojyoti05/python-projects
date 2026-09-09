"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, fullName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('qr_auth_token');
    }
    return false;
  });

  useEffect(() => {
    let isMounted = true;
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('qr_auth_token') : null;
    if (savedToken) {
      api.getMe()
        .then((userData) => {
          if (isMounted) {
            setToken(savedToken);
            setUser(userData);
          }
        })
        .catch(() => {
          if (isMounted) {
            localStorage.removeItem('qr_auth_token');
            setToken(null);
            setUser(null);
          }
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', pass);
    const data = await api.login(params);
    localStorage.setItem('qr_auth_token', data.access_token);
    setToken(data.access_token);
    const me = await api.getMe();
    setUser(me);
  };

  const signup = async (email: string, pass: string, fullName?: string) => {
    await api.signup({ email, password: pass, full_name: fullName });
    await login(email, pass);
  };

  const logout = () => {
    localStorage.removeItem('qr_auth_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
