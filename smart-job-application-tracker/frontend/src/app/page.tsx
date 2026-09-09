"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import {
  Briefcase,
  FileText,
  CheckCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { analyticsAPI, followupsAPI, AnalyticsData, FollowUp } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { user, demoLogin } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [followups, setFollowups] = useState<FollowUp[]>([]);

  useEffect(() => {
    let isMounted = true;
    if (user) {
      Promise.allSettled([
        analyticsAPI.getAnalytics(),
        followupsAPI.getFollowups(),
      ])
        .then(([stats, flws]) => {
          if (!isMounted) return;
          if (stats.status === "fulfilled") setAnalytics(stats.value);
          if (flws.status === "fulfilled") setFollowups(flws.value);
        })
        .catch((err) => {
          console.error("Error loading dashboard data", err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [user]);


  const handleToggleFollowup = async (fId: number, currentCompleted: boolean) => {
    try {
      await followupsAPI.updateFollowup(fId, { is_completed: !currentCompleted });
      setFollowups((prev) =>
        prev.map((f) => (f.id === fId ? { ...f, is_completed: !currentCompleted } : f))
      );
    } catch (err) {
      console.error("Failed to update follow-up", err);
    }
  };

  // Build chart data from actual status counts or fallback distribution
  const chartData = analytics
    ? [
        { name: "Saved", count: analytics.applications_by_status["Saved"] || 0, color: "#60a5fa" },
        { name: "Applied", count: analytics.applications_by_status["Applied"] || 0, color: "#818cf8" },
        { name: "Interview", count: analytics.applications_by_status["Interview"] || 0, color: "#facc15" },
        { name: "Offer", count: analytics.applications_by_status["Offer"] || 0, color: "#4ade80" },
        { name: "Rejected", count: analytics.applications_by_status["Rejected"] || 0, color: "#f87171" },
      ]
    : [
        { name: "Saved", count: 4, color: "#60a5fa" },
        { name: "Applied", count: 8, color: "#818cf8" },
        { name: "Interview", count: 3, color: "#facc15" },
        { name: "Offer", count: 1, color: "#4ade80" },
        { name: "Rejected", count: 2, color: "#f87171" },
      ];

  const totalApps = analytics ? analytics.total_applications : 0;
  const interviewsCount = analytics ? analytics.total_interviews : 0;
  const offersCount = analytics ? analytics.total_offers : 0;
  const pendingCount = analytics ? analytics.pending : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Application Dashboard</h1>
          <p className="text-gray-400 text-sm">Real-time pipeline metrics and upcoming hiring milestones.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/jobs"
            className="flex items-center gap-2 px-4 py-2 bg-[#1b1b1b] hover:bg-[#252525] border border-[#333] text-gray-200 text-sm font-medium rounded-xl transition-colors"
          >
            <Briefcase size={16} /> Search Jobs
          </Link>
          <Link
            href="/board"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg transition-colors"
          >
            <FileText size={16} /> Open Board
          </Link>
        </div>
      </header>

      {/* Guest Banner */}
      {!user && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900/30 via-purple-900/20 to-blue-900/30 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Previewing in Demo Mode</h4>
              <p className="text-xs text-gray-300">Sign in to sync your live applications and save customized pipeline stages.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => demoLogin()}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              One-Click Demo Login
            </button>
            <Link
              href="/login"
              className="px-3.5 py-1.5 bg-[#222] hover:bg-[#2a2a2a] text-gray-300 text-xs font-medium rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            title: "Total Applications",
            value: totalApps,
            icon: FileText,
            color: "text-indigo-400",
            sub: `${pendingCount} currently pending`,
          },
          {
            title: "Interviews Logged",
            value: interviewsCount,
            icon: Clock,
            color: "text-yellow-400",
            sub: `${analytics ? analytics.interview_rate.toFixed(1) : 0}% interview rate`,
          },
          {
            title: "Offers Received",
            value: offersCount,
            icon: CheckCircle,
            color: "text-green-400",
            sub: `${analytics ? analytics.offer_rate.toFixed(1) : 0}% offer rate`,
          },
          {
            title: "Response Rate",
            value: `${analytics ? analytics.response_rate.toFixed(1) : 0}%`,
            icon: TrendingUp,
            color: "text-blue-400",
            sub: "Employer response velocity",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-[#111111] border border-[#222] rounded-2xl p-6 hover:border-[#333] transition-all shadow-sm flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-gray-400 text-xs font-medium tracking-wide uppercase">{stat.title}</span>
              <div className="p-2 rounded-xl bg-[#181818] border border-[#262626]">
                <stat.icon size={18} className={stat.color} />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">{stat.value}</h2>
              <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline Stage Distribution & Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#111111] border border-[#222] rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Application Pipeline by Stage</h3>
              <p className="text-xs text-gray-400">Current distribution of jobs across your recruitment funnel</p>
            </div>
            <Link
              href="/board"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              View Board <ArrowUpRight size={13} />
            </Link>
          </div>

          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="name" stroke="#666" tick={{ fill: "#888", fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" tick={{ fill: "#888", fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "#1a1a1a" }}
                  contentStyle={{
                    backgroundColor: "#141414",
                    borderColor: "#333",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Follow-ups Panel */}
        <div className="bg-[#111111] border border-[#222] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Upcoming Follow-ups</h3>
                <p className="text-xs text-gray-400">Stay on top of employer check-ins</p>
              </div>
              <Calendar size={18} className="text-indigo-400" />
            </div>

            <div className="space-y-3 mt-4">
              {followups.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-[#161616] border border-[#262626] space-y-2">
                  <p className="text-xs text-gray-400">No pending follow-ups scheduled.</p>
                  <p className="text-[11px] text-gray-500">
                    Add reminders directly on your Kanban application cards.
                  </p>
                </div>
              ) : (
                followups.slice(0, 4).map((f) => (
                  <div
                    key={f.id}
                    onClick={() => handleToggleFollowup(f.id, f.is_completed)}
                    className="p-3 bg-[#181818] hover:bg-[#202020] rounded-xl border border-[#2a2a2a] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <CheckCircle2
                        size={16}
                        className={f.is_completed ? "text-green-400" : "text-gray-500"}
                      />
                      <div className="truncate">
                        <p
                          className={`text-xs font-medium truncate ${
                            f.is_completed ? "line-through text-gray-500" : "text-white"
                          }`}
                        >
                          {f.notes || "Follow-up reminder"}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Due: {new Date(f.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        f.is_completed
                          ? "bg-gray-800 text-gray-400"
                          : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      }`}
                    >
                      {f.is_completed ? "Done" : "Pending"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#1f1f1f]">
            <Link
              href="/board"
              className="w-full py-2 px-3 bg-[#181818] hover:bg-[#222] border border-[#2a2a2a] text-gray-300 hover:text-white text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              Manage in Kanban Board <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
