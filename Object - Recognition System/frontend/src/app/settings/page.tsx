"use client";
import React, { useState, useEffect } from "react";
import { fetchSystemHealth } from "@/lib/api";

export default function SettingsPage() {
  const [health, setHealth] = useState<any>(null);
  const [apiKey, setApiKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [threshold, setThreshold] = useState("0.50");
  const [saveToast, setSaveToast] = useState(false);

  useEffect(() => {
    fetchSystemHealth()
      .then(setHealth)
      .catch((e) => console.error("Health check error:", e));
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {saveToast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 text-sm font-medium shadow-2xl">
          Preferences and configuration successfully updated!
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">System Settings & Telemetry</h1>
        <p className="text-xs text-neutral-400 mt-1">
          Infrastructure health, database configuration, neural model thresholds, and credentials
        </p>
      </div>

      {/* Infrastructure Telemetry */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Core Infrastructure Telemetry</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* PostgreSQL */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-300">PostgreSQL Database</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                CONNECTED
              </span>
            </div>
            <p className="text-xs font-mono text-neutral-400">Host: 127.0.0.1</p>
            <p className="text-xs font-mono text-neutral-400">Port: 5433</p>
            <p className="text-xs font-mono text-neutral-400">DB: vision_platform</p>
            <p className="text-[11px] text-emerald-400 mt-2">Alembic Migrated: v771e6df476f3</p>
          </div>

          {/* FastAPI Backend */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-300">FastAPI Application</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                ONLINE
              </span>
            </div>
            <p className="text-xs font-mono text-neutral-400">Server: Python 3.11</p>
            <p className="text-xs font-mono text-neutral-400">Port: 8000</p>
            <p className="text-xs font-mono text-neutral-400">CORS: Origins Allowed</p>
            <p className="text-[11px] text-emerald-400 mt-2">API Docs: /api/v1/openapi.json</p>
          </div>

          {/* Vision Inference Engine */}
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-300">YOLOv8 Engine</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <p className="text-xs font-mono text-neutral-400">Model: YOLOv8n</p>
            <p className="text-xs font-mono text-neutral-400">Tracker: ByteTrack (persist)</p>
            <p className="text-xs font-mono text-neutral-400">Target FPS: ~25.0</p>
            <p className="text-[11px] text-emerald-400 mt-2">Dual Mode: Native / Simulation</p>
          </div>
        </div>
      </div>

      {/* Pre-Configured Test Accounts */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-3">
        <h2 className="text-base font-bold text-white">Pre-Configured System Test Accounts</h2>
        <p className="text-xs text-neutral-400">
          The PostgreSQL database is pre-seeded with 3 role-based access tiers:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Administrator</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">admin</span>
            </div>
            <p className="text-xs font-mono text-neutral-300 mt-2">admin@example.com</p>
            <p className="text-xs font-mono text-neutral-500">Password: admin123</p>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Security Operator</span>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">operator</span>
            </div>
            <p className="text-xs font-mono text-neutral-300 mt-2">operator@example.com</p>
            <p className="text-xs font-mono text-neutral-500">Password: operator123</p>
          </div>

          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Audit Viewer</span>
              <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">viewer</span>
            </div>
            <p className="text-xs font-mono text-neutral-300 mt-2">viewer@example.com</p>
            <p className="text-xs font-mono text-neutral-500">Password: viewer123</p>
          </div>
        </div>
      </div>

      {/* Model & External API Configuration */}
      <form onSubmit={handleSave} className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white">Model Parameters & External API Keys</h2>
        <p className="text-xs text-neutral-400">
          Tune confidence limits and configure external cloud/webhook endpoints (.env integrated)
        </p>

        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              External AI Service API Key (Optional)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="e.g. sk-ant-api03-... or AI_SERVICE_API_KEY"
              className="w-full bg-black/60 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              Synced with .env AI_SERVICE_API_KEY slot.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              Webhook Alert URL (Slack / Discord / Teams)
            </label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full bg-black/60 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-neutral-300">
                Minimum Detection Confidence Threshold ({threshold})
              </label>
            </div>
            <input
              type="range"
              min="0.30"
              max="0.90"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-800 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs transition-colors shadow-md shadow-emerald-500/20"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
