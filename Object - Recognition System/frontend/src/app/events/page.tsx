"use client";
import React, { useState, useEffect, useCallback } from "react";
import { fetchEvents, fetchCameras } from "@/lib/api";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [cameraId, setCameraId] = useState<string>("");
  const [objectClass, setObjectClass] = useState<string>("");
  const [minConfidence, setMinConfidence] = useState<number>(0.5);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const [eventsData, camerasData] = await Promise.all([
        fetchEvents({
          limit: 100,
          search: search || undefined,
          cameraId: cameraId ? Number(cameraId) : undefined,
          objectClass: objectClass || undefined,
          minConfidence: minConfidence > 0.5 ? minConfidence : undefined
        }),
        fetchCameras().catch(() => [])
      ]);
      setEvents(eventsData);
      setCameras(camerasData);
    } catch (e) {
      console.error("Failed to load events", e);
    } finally {
      setLoading(false);
    }
  }, [search, cameraId, objectClass, minConfidence]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadEvents, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadEvents]);

  // CSV Export
  const exportCSV = () => {
    if (events.length === 0) return;
    const headers = ["ID", "Timestamp", "CameraID", "ObjectClass", "Confidence", "TrackingID", "BoundingBox", "Zone"];
    const rows = events.map((e) => [
      e.id,
      e.timestamp,
      e.camera_id,
      e.object_class,
      e.confidence,
      e.tracking_id || "",
      `"${e.bounding_box || ""}"`,
      `"${e.zone_name || ""}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vision_events_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Export
  const exportJSON = () => {
    if (events.length === 0) return;
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vision_events_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Detection Events & Security Audit</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Historical ledger of all object recognition events logged to PostgreSQL
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center space-x-1.5 ${
              autoRefresh
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-neutral-900 text-neutral-400 border-neutral-800"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-400 animate-pulse" : "bg-neutral-600"}`}></span>
            <span>{autoRefresh ? "Auto-Refresh On" : "Auto-Refresh Off"}</span>
          </button>
          <button
            onClick={exportCSV}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={exportJSON}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium transition-colors"
          >
            Export JSON
          </button>
          <button
            onClick={loadEvents}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-semibold transition-colors shadow-md shadow-emerald-500/20"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 shadow-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div>
          <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tracking ID, class, or zone..."
            className="w-full bg-black/60 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Camera Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Camera Feed</label>
          <select
            value={cameraId}
            onChange={(e) => setCameraId(e.target.value)}
            className="w-full bg-black/60 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Cameras</option>
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>
                CAM #{c.id} - {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Object Class Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Object Class</label>
          <select
            value={objectClass}
            onChange={(e) => setObjectClass(e.target.value)}
            className="w-full bg-black/60 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Classes</option>
            <option value="person">Person</option>
            <option value="car">Car / Vehicle</option>
            <option value="truck">Truck</option>
            <option value="backpack">Backpack</option>
            <option value="laptop">Laptop</option>
            <option value="cell phone">Cell Phone</option>
          </select>
        </div>

        {/* Min Confidence Slider */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-neutral-400">Min Confidence</label>
            <span className="text-[11px] font-mono text-emerald-400">{(minConfidence * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="0.95"
            step="0.05"
            value={minConfidence}
            onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="text-[11px] uppercase bg-neutral-950 text-neutral-400 border-b border-neutral-800">
              <tr>
                <th className="px-5 py-3 font-semibold">Event ID</th>
                <th className="px-5 py-3 font-semibold">Time (UTC/Local)</th>
                <th className="px-5 py-3 font-semibold">Camera Node</th>
                <th className="px-5 py-3 font-semibold">Detected Class</th>
                <th className="px-5 py-3 font-semibold">Tracking ID</th>
                <th className="px-5 py-3 font-semibold">Confidence Score</th>
                <th className="px-5 py-3 font-semibold">Bounding Box</th>
                <th className="px-5 py-3 font-semibold">Zone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading && events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-neutral-500">
                    Querying detection events from PostgreSQL...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-neutral-500">
                    No matching detection events found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="px-5 py-3 font-mono text-neutral-500 font-semibold">
                      #{e.id}
                    </td>
                    <td className="px-5 py-3 font-mono text-white whitespace-nowrap">
                      {new Date(e.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-medium text-white">
                      CAM #{e.camera_id}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                        {e.object_class}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-neutral-400">
                      {e.tracking_id || "-"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              e.confidence >= 0.85 ? "bg-emerald-400" : "bg-teal-400"
                            }`}
                            style={{ width: `${e.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="font-mono text-[11px] font-semibold text-white">
                          {(e.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-[11px] text-neutral-400">
                      {e.bounding_box || "-"}
                    </td>
                    <td className="px-5 py-3 text-neutral-400">
                      {e.zone_name || "Perimeter"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-4 bg-neutral-950/60 border-t border-neutral-800 text-xs text-neutral-400 flex items-center justify-between">
          <span>Showing {events.length} detection records</span>
          <span className="font-mono text-emerald-400">PostgreSQL 5433 Indexed</span>
        </div>
      </div>
    </div>
  );
}
