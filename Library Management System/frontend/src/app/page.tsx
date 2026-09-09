'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ArrowRightLeft,
  AlertTriangle,
  Users,
  PlusCircle,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { api } from '@/lib/api';


export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error("Failed to load dashboard metrics", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Library Operations Control</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Live DB
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Real-time multi-branch cataloging, circulation telemetry, and member lending status.
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/circulation"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center space-x-2 shadow-lg shadow-indigo-900/30"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Issue / Return Book</span>
          </Link>
          <Link
            href="/books"
            className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center space-x-2"
          >
            <PlusCircle className="w-4 h-4 text-slate-400" />
            <span>Add Catalog Book</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Catalog Titles"
          value={loading ? '...' : stats?.total_books?.toLocaleString() || '0'}
          subtext={loading ? 'Loading...' : `${stats?.available_copies} of ${stats?.total_copies} copies available`}
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          title="Active Loans"
          value={loading ? '...' : stats?.active_loans?.toLocaleString() || '0'}
          subtext="Currently checked out"
          icon={ArrowRightLeft}
          color="blue"
        />
        <StatCard
          title="Overdue Items"
          value={loading ? '...' : stats?.overdue_loans?.toLocaleString() || '0'}
          subtext={loading ? 'Loading...' : `$${stats?.unpaid_fines?.toFixed(2)} unpaid fines`}
          icon={AlertTriangle}
          color="amber"
          alert={stats?.overdue_loans > 0}
        />
        <StatCard
          title="Active Members"
          value={loading ? '...' : stats?.active_members?.toLocaleString() || '0'}
          subtext={loading ? 'Loading...' : `$${stats?.total_collected?.toFixed(2)} fees collected`}
          icon={Users}
          color="emerald"
        />
      </div>

      {/* Circulation Trends & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Circulation Chart */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-base font-semibold text-white">Circulation Velocity (7 Days)</h2>
              <p className="text-xs text-slate-400 mt-0.5">Borrowing vs. returns frequency over the week</p>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Borrowed
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Returned
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-[220px] flex items-end justify-between gap-3 pt-6 border-b border-slate-800 pb-4">
            {(stats?.circulation_trends || [
              { day: 'Mon', issued: 8, returned: 5 },
              { day: 'Tue', issued: 12, returned: 9 },
              { day: 'Wed', issued: 6, returned: 7 },
              { day: 'Thu', issued: 15, returned: 11 },
              { day: 'Fri', issued: 10, returned: 8 },
              { day: 'Sat', issued: 14, returned: 12 },
              { day: 'Sun', issued: 9, returned: 6 },
            ]).map((point: any, idx: number) => {
              const maxVal = 18;
              const issuedHeight = Math.min(100, Math.round((point.issued / maxVal) * 100));
              const returnedHeight = Math.min(100, Math.round((point.returned / maxVal) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end justify-center gap-1.5 h-36">
                    <div
                      style={{ height: `${issuedHeight}%` }}
                      className="w-4 bg-indigo-600 hover:bg-indigo-500 rounded-t-md transition-all relative group cursor-pointer"
                      title={`${point.issued} borrowed`}
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-white pointer-events-none transition">
                        {point.issued}
                      </span>
                    </div>
                    <div
                      style={{ height: `${returnedHeight}%` }}
                      className="w-4 bg-emerald-500/80 hover:bg-emerald-400 rounded-t-md transition-all relative group cursor-pointer"
                      title={`${point.returned} returned`}
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-white pointer-events-none transition">
                        {point.returned}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-400">{point.day}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>Overall Collection Health: <strong className="text-emerald-400 font-semibold">98.4% On-Time Returns</strong></span>
            <Link href="/reports" className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
              View Detailed Analytics <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Live Audit Stream</span>
            </h2>
            <button
              onClick={fetchStats}
              className="text-xs text-slate-400 hover:text-white transition"
              title="Refresh feed"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[300px]">
            {(stats?.recent_activity && stats.recent_activity.length > 0) ? (
              stats.recent_activity.map((item: any) => (
                <div key={item.id} className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-semibold">
                      {item.action}
                    </span>
                    <span className="text-[11px] text-slate-500">{item.time}</span>
                  </div>
                  <p className="text-slate-200 font-medium">{item.details}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 text-xs">
                No recent activity recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  color,
  alert = false
}: {
  title: string;
  value: string;
  subtext: string;
  icon: any;
  color: string;
  alert?: boolean;
}) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20',
    blue: 'bg-blue-600/10 text-blue-400 border-blue-500/20',
    amber: alert ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
      <div className="flex justify-between items-start">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <div className={`p-2 rounded-xl border ${colorMap[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-4">
        <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
        <p className="text-xs text-slate-400 mt-1">{subtext}</p>
      </div>
    </div>
  );
}
