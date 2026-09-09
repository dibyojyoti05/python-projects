'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Library, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-950 mb-4">
            <Library className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to LiberTech</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to access your library console</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@library.com"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl transition flex items-center justify-center space-x-2 mt-2 shadow-lg shadow-indigo-900/30"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Quick Demo Accounts */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-medium block text-center mb-3">
            Quick 1-Click Test Credentials
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@library.com', 'Admin@123')}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 p-2.5 rounded-xl text-center transition"
            >
              <ShieldCheck className="w-4 h-4 mx-auto text-indigo-400 mb-1" />
              <span className="text-xs font-semibold text-slate-200 block">Admin</span>
              <span className="text-[10px] text-slate-500 block">Full Access</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('librarian@library.com', 'Librarian@123')}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 p-2.5 rounded-xl text-center transition"
            >
              <UserCheck className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
              <span className="text-xs font-semibold text-slate-200 block">Librarian</span>
              <span className="text-[10px] text-slate-500 block">Circulation</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('john.doe@library.com', 'Member@123')}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 p-2.5 rounded-xl text-center transition"
            >
              <Sparkles className="w-4 h-4 mx-auto text-amber-400 mb-1" />
              <span className="text-xs font-semibold text-slate-200 block">Member</span>
              <span className="text-[10px] text-slate-500 block">Faculty</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
