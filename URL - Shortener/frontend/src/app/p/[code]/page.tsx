"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/axios";
import { Lock } from "lucide-react";

export default function PasswordGateway() {
  const params = useParams();
  const code = params.code as string;
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Assuming backend is running on 8000, and our axios instance hits /api/v1
      // Note: we registered the redirect router at root, so we should use a direct axios call or adjust api URL
      // Since it's registered at root, it's not under /api/v1. We will use a standard fetch or adjust base URL.
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
      
      const res = await fetch(`${baseUrl}/${code}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Incorrect password");
      }
      
      const data = await res.json();
      // Redirect to the actual destination
      window.location.href = data.destination;
    } catch (err: any) {
      setError(err.message || "Failed to unlock link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white dark:bg-gray-800 p-10 shadow-xl border border-gray-200 dark:border-gray-700 text-center">
        <div className="flex justify-center">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
            <Lock className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Protected Link
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This link is password protected. Please enter the password to continue.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="rounded-md shadow-sm">
            <input
              type="password"
              required
              className="relative block w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-3 text-gray-900 dark:text-white focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-gray-50 dark:bg-gray-900"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-3 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 transition"
            >
              {loading ? "Unlocking..." : "Unlock Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
