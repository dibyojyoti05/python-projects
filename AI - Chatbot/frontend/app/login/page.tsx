"use client";

import { useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import axios from "axios";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);
  
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        // 1. Call registration endpoint
        await axios.post(`${API_BASE_URL}/api/v1/auth/register`, {
          email: email.trim(),
          password: password,
          full_name: fullName.trim() || undefined,
        });
      }

      // 2. Perform login to get access token
      const formData = new URLSearchParams();
      formData.append("username", email.trim());
      formData.append("password", password);

      const res = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const accessToken = res.data.access_token;
      setToken(accessToken);

      // 3. Fetch user profile
      const userRes = await axios.get(`${API_BASE_URL}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUser(userRes.data);

      router.push("/chat");
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === "string") {
          setError(detail);
        } else if (Array.isArray(detail)) {
          setError(detail[0]?.msg || "Validation error");
        } else {
          setError("An error occurred. Please try again.");
        }
      } else {
        setError(isRegister ? "Registration failed. Please try again." : "Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[130px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/20 blur-[130px]" />

      <Link 
        href="/" 
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="glass p-8 rounded-3xl w-full max-w-md border border-white/10 relative z-10 shadow-2xl shadow-blue-950/30"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 mb-3 shadow-lg shadow-blue-500/25">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isRegister ? "Create an Account" : "Welcome Back"}
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            {isRegister ? "Sign up to start chatting with Enterprise AI" : "Enter your credentials to access your assistant"}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-white/5 p-1 rounded-xl mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(""); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              !isRegister ? "bg-white text-black shadow" : "text-zinc-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(""); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              isRegister ? "bg-white text-black shadow" : "text-zinc-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium"
          >
            {error}
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence>
            {isRegister && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label className="block text-zinc-400 text-xs uppercase tracking-wider font-semibold mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors text-sm"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-zinc-400 text-xs uppercase tracking-wider font-semibold mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@enterprise.com"
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-xs uppercase tracking-wider font-semibold mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors text-sm"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-white to-zinc-200 text-black font-semibold rounded-xl px-4 py-3 hover:opacity-95 transition-all mt-6 flex items-center justify-center gap-2 shadow-lg shadow-white/5 disabled:opacity-50 text-sm cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
