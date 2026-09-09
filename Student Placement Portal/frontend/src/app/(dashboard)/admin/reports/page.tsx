"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import {
  BarChart3, GraduationCap, Building2, FileCheck,
  TrendingUp, Award, Download
} from "lucide-react";

interface Analytics {
  total_students: number;
  total_placed_students: number;
  placement_rate: number;
  total_companies: number;
  total_jobs_posted: number;
  total_applications: number;
  branch_stats: {
    department: string;
    total_students: number;
    placed_students: number;
    placement_rate: number;
  }[];
  top_recruiters: {
    company: string;
    jobs_posted: number;
  }[];
}

export default function PlacementReportsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const data = await fetchApi("/admin/reports/analytics");
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to load placement analytics", err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 bg-white/15 rounded-full text-xs font-semibold uppercase tracking-wider">
            Institutional Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">Campus Placement Analytics & Drive Reports</h1>
          <p className="text-slate-300 text-xs mt-1">
            Real-time breakdown of candidate placement success, department placement ratios, and hiring volume.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold shadow-md transition-all self-start sm:self-center"
        >
          <Download className="w-4 h-4" /> Export Report (Print / PDF)
        </button>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Placement Rate</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{analytics.placement_rate}%</div>
          <span className="text-xs text-slate-500 mt-1 block">
            {analytics.total_placed_students} of {analytics.total_students} registered students placed
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Students</span>
            <GraduationCap className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{analytics.total_students}</div>
          <span className="text-xs text-slate-500 mt-1 block">Across all engineering & tech departments</span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Partner Companies</span>
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{analytics.total_companies}</div>
          <span className="text-xs text-slate-500 mt-1 block">{analytics.total_jobs_posted} active placement drives</span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Applications</span>
            <FileCheck className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{analytics.total_applications}</div>
          <span className="text-xs text-slate-500 mt-1 block">Candidate applications processed</span>
        </div>
      </div>

      {/* Department Breakdown & Top Recruiters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" /> Branch / Department Placement Breakdown
          </h2>

          <div className="space-y-4 pt-2">
            {analytics.branch_stats.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No branch metrics recorded yet.</p>
            ) : (
              analytics.branch_stats.map((b, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-800">{b.department}</span>
                    <span className="text-blue-600">
                      {b.placed_students} / {b.total_students} Placed ({b.placement_rate}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(b.placement_rate, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Recruiters */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" /> Top Hiring Partners
          </h2>

          <div className="space-y-3 pt-2">
            {analytics.top_recruiters.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No hiring data recorded yet.</p>
            ) : (
              analytics.top_recruiters.map((rec, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{rec.company}</span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                    {rec.jobs_posted} {rec.jobs_posted === 1 ? "Role" : "Roles"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
