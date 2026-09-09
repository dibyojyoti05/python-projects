"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { scrapingAPI, api, getErrorMessage } from "@/lib/api";
import {
  User,
  Bot,
  CheckCircle2,
  AlertCircle,
  Play,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Server,
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { user, logout, demoLogin } = useAuth();
  const [scrapeKeyword, setScrapeKeyword] = useState("Python");
  const [scrapeLocation, setScrapeLocation] = useState("remote");
  const [scrapeStatus, setScrapeStatus] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [apiHealth, setApiHealth] = useState<"checking" | "online" | "offline">("checking");
  const [apiLatency, setApiLatency] = useState<number | null>(null);

  const checkHealth = async () => {
    setApiHealth("checking");
    const start = performance.now();
    try {
      await api.get("/");
      const end = performance.now();
      setApiLatency(Math.round(end - start));
      setApiHealth("online");
    } catch {
      setApiHealth("offline");
      setApiLatency(null);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const start = performance.now();
    api
      .get("/")
      .then(() => {
        if (!isMounted) return;
        const end = performance.now();
        setApiLatency(Math.round(end - start));
        setApiHealth("online");
      })
      .catch(() => {
        if (!isMounted) return;
        setApiHealth("offline");
        setApiLatency(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRunScraper = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScraping(true);
    setScrapeStatus("Triggering scraper providers...");
    try {
      const res = await scrapingAPI.triggerScraping(scrapeKeyword, scrapeLocation);
      setScrapeStatus(`Success: ${res.status} (Task: ${res.task_id})`);
    } catch (err: unknown) {
      setScrapeStatus(`Error: ${getErrorMessage(err)}`);
    } finally {
      setIsScraping(false);
    }
  };


  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">System Settings & Controls</h1>
        <p className="text-gray-400 text-sm">Manage scraper jobs, authentication, and monitor service connections.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Account Card */}
        <div className="bg-[#111111] border border-[#222] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Account Profile</h3>
                <p className="text-xs text-gray-400">Current authentication status</p>
              </div>
            </div>

            {user ? (
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-[#181818] rounded-xl border border-[#2a2a2a] flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Email</span>
                  <span className="text-white font-medium">{user.email}</span>
                </div>
                <div className="p-3 bg-[#181818] rounded-xl border border-[#2a2a2a] flex justify-between items-center">
                  <span className="text-gray-400 text-xs">User ID</span>
                  <span className="text-white font-mono text-xs">#{user.id}</span>
                </div>
                <div className="p-3 bg-[#181818] rounded-xl border border-[#2a2a2a] flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Status</span>
                  <span className="text-green-400 text-xs font-semibold flex items-center gap-1">
                    <ShieldCheck size={14} /> Active
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center space-y-3 bg-[#181818] rounded-xl border border-[#2a2a2a]">
                <p className="text-xs text-gray-400">You are currently operating in guest mode.</p>
                <div className="flex gap-2 justify-center">
                  <Link
                    href="/login"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Sign In
                  </Link>
                  <button
                    onClick={() => demoLogin()}
                    className="px-4 py-2 bg-[#262626] hover:bg-[#333] text-gray-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Quick Demo Login
                  </button>
                </div>
              </div>
            )}
          </div>

          {user && (
            <button
              onClick={logout}
              className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-xl border border-red-500/20 transition-colors cursor-pointer"
            >
              <LogOut size={15} /> Sign Out of Tracker
            </button>
          )}
        </div>

        {/* Server & DB Health */}
        <div className="bg-[#111111] border border-[#222] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center">
                  <Server size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">System Connectivity</h3>
                  <p className="text-xs text-gray-400">Backend & database server status</p>
                </div>
              </div>

              <button
                onClick={checkHealth}
                className="p-2 rounded-lg bg-[#181818] hover:bg-[#222] text-gray-400 hover:text-white transition-colors cursor-pointer"
                title="Refresh Status"
              >
                <RefreshCw size={15} />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-[#181818] rounded-xl border border-[#2a2a2a] flex justify-between items-center">
                <span className="text-gray-400 text-xs">FastAPI Backend (8000)</span>
                {apiHealth === "online" ? (
                  <span className="text-green-400 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Online {apiLatency ? `(${apiLatency}ms)` : ""}
                  </span>
                ) : apiHealth === "checking" ? (
                  <span className="text-yellow-400 text-xs">Checking...</span>
                ) : (
                  <span className="text-red-400 text-xs font-semibold flex items-center gap-1.5">
                    <AlertCircle size={14} /> Unreachable
                  </span>
                )}
              </div>

              <div className="p-3 bg-[#181818] rounded-xl border border-[#2a2a2a] flex justify-between items-center">
                <span className="text-gray-400 text-xs">PostgreSQL Database</span>
                <span className="text-indigo-400 text-xs font-mono">127.0.0.1:5433 / job_tracker</span>
              </div>

              <div className="p-3 bg-[#181818] rounded-xl border border-[#2a2a2a] flex justify-between items-center">
                <span className="text-gray-400 text-xs">Active Job Providers</span>
                <span className="text-white text-xs font-medium">RemoteOK, Arbeitnow</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[11px] text-gray-400 leading-relaxed">
            All scrapers run with automated deduplication (exact URL, external ID, and fuzzy string matching).
          </div>
        </div>
      </div>

      {/* Scraper Control Center */}
      <div className="bg-[#111111] border border-[#222] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-white">Job Scraper Control Center</h3>
            <p className="text-xs text-gray-400">Trigger on-demand multi-provider scraping into the database</p>
          </div>
        </div>

        <form onSubmit={handleRunScraper} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Target Keyword / Role</label>
            <input
              type="text"
              required
              value={scrapeKeyword}
              onChange={(e) => setScrapeKeyword(e.target.value)}
              placeholder="e.g. Python, React, DevOps"
              className="w-full bg-[#181818] border border-[#333] rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Location Filter</label>
            <input
              type="text"
              value={scrapeLocation}
              onChange={(e) => setScrapeLocation(e.target.value)}
              placeholder="e.g. Remote, Europe, USA"
              className="w-full bg-[#181818] border border-[#333] rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isScraping}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isScraping ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Scraping...
                </>
              ) : (
                <>
                  <Play size={16} /> Run Scraper Now
                </>
              )}
            </button>
          </div>
        </form>

        {scrapeStatus && (
          <div className="p-3.5 bg-[#181818] rounded-xl border border-[#2a2a2a] text-xs font-mono text-gray-300 flex items-center gap-2">
            <Bot size={14} className="text-indigo-400" />
            {scrapeStatus}
          </div>
        )}
      </div>
    </div>
  );
}
