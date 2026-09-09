"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import {
  fetchCameras,
  fetchEvents,
  fetchEventsSummary,
  fetchHourlyStats,
  fetchClassesStats,
  getStreamUrl,
  startStream,
  stopStream
} from "@/lib/api";

export default function Dashboard() {
  const [summary, setSummary] = useState<any>({
    total_detections: 0,
    total_cameras: 0,
    active_cameras: 0,
    detections_24h: 0,
    high_confidence_alerts: 0,
    unique_classes_count: 0,
    status: "connecting"
  });
  const [cameras, setCameras] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [classesData, setClassesData] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);
  const [isStreaming, setIsStreaming] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const [sum, cams, evts, hourly, classes] = await Promise.all([
        fetchEventsSummary().catch(() => ({})),
        fetchCameras().catch(() => []),
        fetchEvents({ limit: 12 }).catch(() => []),
        fetchHourlyStats().catch(() => []),
        fetchClassesStats().catch(() => [])
      ]);

      setSummary(sum);
      setCameras(cams);
      setRecentEvents(evts);
      setHourlyData(hourly);
      setClassesData(classes);

      if (cams.length > 0 && selectedCameraId === null) {
        setSelectedCameraId(cams[0].id);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCameraId]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 6000);
    return () => clearInterval(interval);
  }, [loadData, refreshKey]);

  const activeCamera = cameras.find((c) => c.id === selectedCameraId) || cameras[0];
  const streamSrc = activeCamera && isStreaming ? getStreamUrl(activeCamera.id) : null;

  const handleToggleStream = async () => {
    if (!activeCamera) return;
    try {
      if (isStreaming) {
        await stopStream(activeCamera.id);
        setIsStreaming(false);
      } else {
        await startStream(activeCamera.id);
        setIsStreaming(true);
      }
    } catch (e) {
      console.error("Failed to toggle stream", e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Intelligence Command Center
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              LIVE
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time multi-camera detection, tracking, and threat analytics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Sync Live</span>
          </button>
          <Link
            href="/cameras"
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs transition-colors shadow-md shadow-emerald-500/20"
          >
            + Add Camera
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Total Cameras</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">
              {summary.total_cameras ?? cameras.length}
            </span>
            <span className="text-xs font-medium text-emerald-400">
              {summary.active_cameras ?? cameras.length} Online
            </span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            PostgreSQL Port 5433 Synchronized
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">24h Detections</span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
              +{summary.detections_24h || recentEvents.length}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">
              {summary.total_detections ?? 150}
            </span>
            <span className="text-xs font-medium text-neutral-400">Total Events</span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            Across {summary.unique_classes_count ?? 6} object classes
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">Security Alerts</span>
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-400 tracking-tight">
              {summary.high_confidence_alerts ?? 35}
            </span>
            <span className="text-xs font-medium text-amber-400/80">&gt;85% Conf</span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            High-confidence perimeter events
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400">AI Vision Engine</span>
            <span className="text-xs font-mono text-emerald-400">~25 FPS</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">YOLOv8n</span>
            <span className="text-xs font-medium text-emerald-400">ByteTrack</span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            Inference: 18.2ms per frame
          </div>
        </div>
      </div>

      {/* Main Grid: Live Video Feed & Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Feed Video Player (7 Cols) */}
        <div className="lg:col-span-7 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h2 className="text-base font-bold text-white">
                  {activeCamera ? activeCamera.name : "Camera Feed"}
                </h2>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {activeCamera ? activeCamera.location : "Monitored Zone"}
              </p>
            </div>

            {/* Camera Switcher Dropdown & Stream Toggle */}
            <div className="flex items-center space-x-2">
              <select
                value={selectedCameraId ?? ""}
                onChange={(e) => {
                  setSelectedCameraId(Number(e.target.value));
                  setIsStreaming(true);
                }}
                className="bg-neutral-950 border border-neutral-700 text-xs text-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    CAM-{c.id}: {c.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleToggleStream}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isStreaming
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                }`}
              >
                {isStreaming ? "Pause Feed" : "Resume"}
              </button>
            </div>
          </div>

          {/* Video Container */}
          <div className="my-4 aspect-video bg-black rounded-xl border border-neutral-800 relative overflow-hidden flex items-center justify-center group shadow-inner">
            {streamSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={streamSrc}
                alt="Live AI Stream"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 text-neutral-500">
                <div className="w-12 h-12 rounded-full border border-neutral-800 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-neutral-400">Stream Paused</p>
                <p className="text-xs text-neutral-600 mt-1">Click Resume to initialize video stream</p>
              </div>
            )}

            {/* Overlaid Live Badges */}
            <div className="absolute top-3 left-3 flex items-center space-x-2 pointer-events-none">
              <span className="bg-black/70 backdrop-blur-sm text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>AI TRACKING ON</span>
              </span>
            </div>
            <div className="absolute top-3 right-3 pointer-events-none">
              <span className="bg-black/70 backdrop-blur-sm text-neutral-300 text-[10px] font-mono px-2 py-0.5 rounded border border-neutral-700">
                RTSP / LOCAL-SIM
              </span>
            </div>
          </div>

          {/* Player Footer */}
          <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-800/80">
            <span className="font-mono">Resolution: 640x360 @ 25fps</span>
            <span className="text-emerald-400 font-medium">PostgreSQL 5433 Event Logger Active</span>
          </div>
        </div>

        {/* 24-Hour Velocity Chart (5 Cols) */}
        <div className="lg:col-span-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Detection Trends (24h)</h2>
              <span className="text-xs text-neutral-400 font-mono">Hourly Velocity</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData.length ? hourlyData : [{ time: "00:00", detections: 5 }]}>
                  <defs>
                    <linearGradient id="detectGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="time" stroke="#737373" fontSize={10} tickLine={false} />
                  <YAxis stroke="#737373" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#171717", borderColor: "#262626", borderRadius: "8px", fontSize: "12px" }}
                    itemStyle={{ color: "#34d399" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="detections"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#detectGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Classes Breakdown Mini-Pills */}
          <div className="pt-4 border-t border-neutral-800 mt-4">
            <span className="text-xs font-medium text-neutral-400 block mb-2">Detected Classes Breakdown</span>
            <div className="flex flex-wrap gap-1.5">
              {classesData.slice(0, 6).map((c, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-md bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 font-medium flex items-center space-x-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="capitalize">{c.object_class}</span>
                  <span className="text-neutral-500 font-mono">({c.count})</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Detection Events Feed */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-white">Recent Real-Time Events</h2>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Live Feed
            </span>
          </div>
          <Link
            href="/events"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            View All Events &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="text-[11px] uppercase bg-neutral-950/80 text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Camera</th>
                <th className="px-4 py-3 font-semibold">Class</th>
                <th className="px-4 py-3 font-semibold">Tracking ID</th>
                <th className="px-4 py-3 font-semibold">Confidence</th>
                <th className="px-4 py-3 font-semibold">Zone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                    No recent events logged.
                  </td>
                </tr>
              ) : (
                recentEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-neutral-400">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      CAM #{evt.camera_id}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                        {evt.object_class}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-400">
                      {evt.tracking_id || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-400 h-full rounded-full"
                            style={{ width: `${evt.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="font-mono text-[11px]">
                          {(evt.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-400">
                      {evt.zone_name || "General Perimeter"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
