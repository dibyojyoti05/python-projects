"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, authAPI, getErrorMessage } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading] = useState(false);


  useEffect(() => {
    const savedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!savedToken) {
      return;
    }

    let isMounted = true;
    authAPI
      .getMe()
      .then((me) => {
        if (isMounted) {
          setToken(savedToken);
          setUser(me);
        }
      })
      .catch(() => {
        if (isMounted) {
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);


  const login = useCallback(async (email: string, pass: string) => {
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", pass);
    const data = await authAPI.login(formData);
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
    const me = await authAPI.getMe();
    setUser(me);
  }, []);

  const register = useCallback(async (email: string, pass: string) => {
    await authAPI.register(email, pass);
    await login(email, pass);
  }, [login]);

  const demoLogin = useCallback(async () => {
    const demoEmail = "demo@example.com";
    const demoPass = "demo123456";
    try {
      await login(demoEmail, demoPass);
    } catch {
      try {
        await authAPI.register(demoEmail, demoPass);
        await login(demoEmail, demoPass);
      } catch (err: unknown) {
        const msg = getErrorMessage(err);
        if (msg.includes("already registered")) {
          await login(demoEmail, demoPass);
        } else {
          throw err;
        }
      }
    }
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
