"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { ArrowRight, LinkIcon, BarChart3, TrendingUp, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardHome() {
  const [stats, setStats] = useState({ total_clicks: 0, unique_clicks: 0 });
  const [timeseries, setTimeseries] = useState([]);
  const [recentLinks, setRecentLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { activeOrgId } = useAuthStore();

  useEffect(() => {
    if (activeOrgId) {
      fetchDashboardData();
    }
  }, [activeOrgId]);

  const fetchDashboardData = async () => {
    try {
      const [overviewRes, timeseriesRes, linksRes] = await Promise.all([
        api.get(`/analytics/overview?organization_id=${activeOrgId}`),
        api.get(`/analytics/timeseries?organization_id=${activeOrgId}`),
        api.get(`/links/?organization_id=${activeOrgId}`)
      ]);
      setStats(overviewRes.data);
      setTimeseries(timeseriesRes.data.slice(-7)); // Last 7 days
      setRecentLinks(linksRes.data.slice(0, 5)); // Top 5 recent links
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null; // handled by layout skeleton conceptually

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back!</h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your links today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Card 1 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <BarChart3 className="w-24 h-24 text-indigo-600" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Engagements</p>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2">{stats.total_clicks}</h2>
          <div className="flex items-center text-sm text-green-600 font-medium">
            <TrendingUp size={16} className="mr-1" /> +14.2% this week
          </div>
        </div>
        
        {/* Stat Card 2 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <TrendingUp className="w-24 h-24 text-green-600" />
          </div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Unique Visitors</p>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2">{stats.unique_clicks}</h2>
          <div className="flex items-center text-sm text-green-600 font-medium">
            <TrendingUp size={16} className="mr-1" /> +8.1% this week
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-indigo-600 p-6 rounded-xl border border-indigo-500 shadow-sm text-white flex flex-col justify-center">
          <h3 className="text-xl font-bold mb-2">Create new link</h3>
          <p className="text-indigo-100 text-sm mb-4">Shorten a URL and start tracking instantly.</p>
          <Link href="/links/new">
            <button className="bg-white text-indigo-600 font-semibold py-2 px-4 rounded-lg w-full flex items-center justify-center gap-2 hover:bg-indigo-50 transition">
              <LinkIcon size={18} /> Shorten URL
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mini Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Traffic Overview</h3>
            <Link href="/analytics" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
              Full Report <ArrowRight size={14} />
            </Link>
          </div>
          <div className="h-64 w-full">
            {timeseries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeseries} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#374151', opacity: 0.1 }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="clicks" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
            )}
          </div>
        </div>

        {/* Recent Links */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Links</h3>
            <Link href="/links" className="text-sm text-indigo-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {recentLinks.length > 0 ? (
              recentLinks.map((link) => (
                <div key={link.id} className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition group">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {link.custom_slug || link.short_code}
                    </p>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                      <Clock size={12} /> just now
                    </p>
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    0
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500 text-center py-8">No links generated yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
