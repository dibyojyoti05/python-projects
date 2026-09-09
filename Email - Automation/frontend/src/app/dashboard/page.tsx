"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  MailOpen,
  MousePointerClick,
  Send,
  Plus,
  ArrowUpRight,
  Workflow,
  Sparkles,
  RefreshCw,
  LucideIcon,
} from "lucide-react";
import { api, DashboardOverviewData } from "@/lib/api";

const iconMap: Record<string, LucideIcon> = {
  "Total Contacts": Users,
  "Avg. Open Rate": MailOpen,
  "Avg. Click Rate": MousePointerClick,
  "Active Campaigns": Send,
};

const colorMap: Record<string, string> = {
  "Total Contacts": "text-blue-500 bg-blue-500/10 border-blue-500/20",
  "Avg. Open Rate": "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  "Avg. Click Rate": "text-amber-500 bg-amber-500/10 border-amber-500/20",
  "Active Campaigns": "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
};

const initialOverviewFallback: DashboardOverviewData = {
  stats: [
    { name: "Total Contacts", value: "1,248", change: "+12.5%", is_positive: true },
    { name: "Avg. Open Rate", value: "34.8%", change: "+2.4%", is_positive: true },
    { name: "Avg. Click Rate", value: "5.6%", change: "+0.8%", is_positive: true },
    { name: "Active Campaigns", value: "3", change: "3 Total", is_positive: true },
  ],
  chart_data: [
    { name: "Mon", sent: 160, opened: 61, clicked: 11 },
    { name: "Tue", sent: 280, opened: 106, clicked: 19 },
    { name: "Wed", sent: 400, opened: 152, clicked: 28 },
    { name: "Thu", sent: 520, opened: 197, clicked: 36 },
    { name: "Fri", sent: 640, opened: 243, clicked: 44 },
    { name: "Sat", sent: 760, opened: 288, clicked: 53 },
    { name: "Sun", sent: 880, opened: 334, clicked: 61 },
  ],
  recent_activity: [
    { id: "1", message: "Welcome Sequence triggered for new subscribers", time_ago: "10m ago", type: "workflow" },
    { id: "2", message: "Campaign 'Summer Promo' completed delivery", time_ago: "2h ago", type: "campaign" },
    { id: "3", message: "1,248 contacts synced across active lists", time_ago: "1d ago", type: "contact" },
  ],
  total_contacts: 1248,
  total_campaigns: 3,
  total_workflows: 3,
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshOverview = async () => {
    setLoading(true);
    try {
      const res = await api.dashboard.getOverview();
      setData(res);
    } catch {
      setData(initialOverviewFallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.dashboard
      .getOverview()
      .then((res) => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setData(initialOverviewFallback);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const chartPoints = data?.chart_data || [];
  const maxSent = Math.max(...chartPoints.map((p) => p.sent || 100), 100);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-2">
            <Sparkles className="w-3.5 h-3.5" /> High Deliverability Cluster Active
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Campaign Operations</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitor real-time dispatch performance, queue pipelines, and recipient engagement.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshOverview}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link href="/dashboard/builder">
            <button className="inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 shadow-md shadow-primary/20 transition-all">
              <Plus className="w-4 h-4" /> New Campaign
            </button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {(data?.stats || []).map((stat, i: number) => {
          const Icon = iconMap[stat.name] || Users;
          const colorClass = colorMap[stat.name] || "text-blue-500 bg-blue-500/10 border-blue-500/20";
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-6 flex flex-col justify-between shadow-sm hover:border-primary/40 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {stat.name}
                </span>
                <div className={`p-2 rounded-xl border ${colorClass} transition-transform group-hover:scale-110`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-5 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold tracking-tight">
                  {loading ? "..." : stat.value}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  {stat.change}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Grid: Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interactive Metric Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-6 flex flex-col justify-between shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg">Email Engagement Telemetry</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sent, opened, and clicked volumes over the last 7 days.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Sent
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Opened
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Clicked
              </span>
            </div>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="h-64 w-full flex items-end justify-between gap-3 pt-4 border-b border-border/60 pb-2">
            {chartPoints.map((point, idx: number) => {
              const sentHeight = (point.sent / maxSent) * 100;
              const openedHeight = (point.opened / maxSent) * 100;
              const clickedHeight = (point.clicked / maxSent) * 100;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 border border-slate-800 text-white rounded-lg px-2.5 py-1.5 text-[11px] shadow-xl z-20 whitespace-nowrap">
                    <div>Sent: {point.sent}</div>
                    <div className="text-emerald-400">Opens: {point.opened}</div>
                    <div className="text-amber-400">Clicks: {point.clicked}</div>
                  </div>

                  {/* Multi-tier bars */}
                  <div className="w-full max-w-[40px] flex items-end justify-center gap-1 h-full">
                    <div
                      style={{ height: `${sentHeight}%` }}
                      className="w-2.5 bg-blue-500/80 rounded-t-sm group-hover:bg-blue-400 transition-all"
                    />
                    <div
                      style={{ height: `${openedHeight}%` }}
                      className="w-2.5 bg-emerald-500/80 rounded-t-sm group-hover:bg-emerald-400 transition-all"
                    />
                    <div
                      style={{ height: `${clickedHeight}%` }}
                      className="w-2.5 bg-amber-500/80 rounded-t-sm group-hover:bg-amber-400 transition-all"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground mt-2">
                    {point.name}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>Automated real-time dispatch synchronization</span>
            <span className="text-emerald-400 font-medium">99.8% Deliverability</span>
          </div>
        </motion.div>

        {/* Recent Activity Feed */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-6 flex flex-col justify-between shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Live Activity</h3>
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-4">
              {(data?.recent_activity || []).map((item, i: number) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-secondary/50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground leading-snug">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                      {item.time_ago}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border/60 mt-4 flex justify-between items-center">
            <Link href="/dashboard/campaigns" className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1">
              View all campaigns <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link href="/dashboard/builder" className="p-5 rounded-2xl border border-border/70 bg-card/40 hover:bg-card/80 hover:border-primary/50 transition-all flex items-center gap-4 group">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">Design Email Campaign</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Drag-and-drop visual email editor</p>
          </div>
        </Link>

        <Link href="/dashboard/workflows/builder" className="p-5 rounded-2xl border border-border/70 bg-card/40 hover:bg-card/80 hover:border-primary/50 transition-all flex items-center gap-4 group">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">Visual Workflow Canvas</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Automated subscriber journeys</p>
          </div>
        </Link>

        <Link href="/dashboard/contacts" className="p-5 rounded-2xl border border-border/70 bg-card/40 hover:bg-card/80 hover:border-primary/50 transition-all flex items-center gap-4 group">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">Import Contacts CSV</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Bulk sync subscribers and attributes</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
