"use client";
import React, { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { login as apiLogin } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const data = await apiLogin(email, password);
      login(data.access_token);
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setEmail(u);
    setPassword(p);
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white px-4 relative overflow-hidden">
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-emerald-500/15 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-teal-500/15 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md p-8 bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl shadow-2xl z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl mb-3 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg className="w-7 h-7 text-neutral-950 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Vision Intelligence</h2>
          <p className="text-xs text-neutral-400 mt-1">Enterprise Real-Time Object Recognition Platform</p>
        </div>

        {/* Quick Test Login Presets */}
        <div className="mb-6 p-3 bg-neutral-950/70 border border-neutral-800 rounded-2xl">
          <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase block mb-2">
            1-Click Preset Credentials
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickFill("admin@example.com", "admin123")}
              className="px-2 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/60 text-[11px] font-semibold text-emerald-400 hover:border-emerald-500/50 transition-all text-center"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("operator@example.com", "operator123")}
              className="px-2 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/60 text-[11px] font-semibold text-teal-400 hover:border-teal-500/50 transition-all text-center"
            >
              Operator
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("viewer@example.com", "viewer123")}
              className="px-2 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/60 text-[11px] font-semibold text-neutral-300 hover:border-neutral-500/50 transition-all text-center"
            >
              Viewer
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-black/60 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-all"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-black/60 border border-neutral-700 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 mt-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                <span>Signing In...</span>
              </span>
            ) : (
              <span>Sign In to Platform</span>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-[11px] text-neutral-500">
          PostgreSQL Database on 127.0.0.1:5433
        </div>
      </div>
    </div>
  );
}
