"use client";

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Smartphone, Monitor, Globe, Clock, 
  ExternalLink, RefreshCw, Sparkles, 
  Users, Activity 
} from 'lucide-react';
import { api, QRCodeItem, QRCodeAnalytics as AnalyticsData } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface QRAnalyticsProps {
  selectedQrId?: string;
  onOpenAuth: () => void;
}

export default function QRAnalytics({ selectedQrId, onOpenAuth }: QRAnalyticsProps) {
  const { isAuthenticated } = useAuth();
  const [qrs, setQrs] = useState<QRCodeItem[]>([]);
  const [currentId, setCurrentId] = useState<string>(selectedQrId || '');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.getAnalytics(id);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!isAuthenticated) return;

    api.listQRs()
      .then((data) => {
        if (!isMounted) return;
        setQrs(data);
        const targetId = selectedQrId || (data.length > 0 ? data[0].id : '');
        if (targetId) {
          setCurrentId(targetId);
          api.getAnalytics(targetId)
            .then((analyticsData) => {
              if (isMounted) setAnalytics(analyticsData);
            })
            .catch(console.error);
        }
      })
      .catch(console.error);

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, selectedQrId]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Sign In for Scan Intelligence</h2>
        <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
          Gain visibility into visitor geography, device types, browser platforms, and real-time scan events.
        </p>
        <button
          onClick={onOpenAuth}
          className="mt-6 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const selectedQR = qrs.find((q) => q.id === currentId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & QR Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            <span>Scan Telemetry & Intelligence</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Real-Time Analytics Studio
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit logs and device fingerprints captured on dynamic QR redirects.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={currentId}
            onChange={(e) => setCurrentId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[220px]"
          >
            {qrs.map((qr) => (
              <option key={qr.id} value={qr.id}>
                {qr.name} ({qr.is_dynamic ? 'Dynamic' : 'Static'})
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchAnalytics(currentId)}
            title="Refresh analytics"
            className="p-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Test Scan Callout */}
      {selectedQR && selectedQR.is_dynamic && selectedQR.short_code && (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Live Tracking Test URL</h4>
              <p className="text-[11px] text-slate-400 font-mono">
                {api.getRedirectUrl(selectedQR.short_code)}
              </p>
            </div>
          </div>
          <a
            href={api.getRedirectUrl(selectedQR.short_code)}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 transition-all self-stretch sm:self-auto justify-center"
          >
            <span>Trigger Test Scan</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* KPI Cards */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Scans</span>
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{analytics.total_scans}</div>
            <div className="text-[11px] text-slate-500 mt-1">All recorded redirects</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Unique Visitors</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400 mt-2">{analytics.unique_visitors}</div>
            <div className="text-[11px] text-slate-500 mt-1">Distinct IP addresses</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Last Scanned</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-sm font-semibold text-white mt-3 truncate">
              {analytics.last_scanned_at ? new Date(analytics.last_scanned_at).toLocaleString() : 'No scans yet'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Most recent activity</div>
          </div>
        </div>
      )}

      {/* Telemetry Distributions: Devices, Browsers, OS */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Device Type */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span>Device Distribution</span>
            </div>
            <div className="space-y-2 pt-2">
              {Object.keys(analytics.devices).length === 0 ? (
                <div className="text-xs text-slate-500 italic">No device data yet</div>
              ) : (
                Object.entries(analytics.devices).map(([dev, count]) => {
                  const pct = analytics.total_scans > 0 ? Math.round((count / analytics.total_scans) * 100) : 0;
                  return (
                    <div key={dev} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>{dev}</span>
                        <span className="font-mono text-slate-400">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Browsers */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Browser Breakdown</span>
            </div>
            <div className="space-y-2 pt-2">
              {Object.keys(analytics.browsers).length === 0 ? (
                <div className="text-xs text-slate-500 italic">No browser data yet</div>
              ) : (
                Object.entries(analytics.browsers).map(([browser, count]) => {
                  const pct = analytics.total_scans > 0 ? Math.round((count / analytics.total_scans) * 100) : 0;
                  return (
                    <div key={browser} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>{browser}</span>
                        <span className="font-mono text-slate-400">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Operating Systems */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
              <Monitor className="w-4 h-4 text-cyan-400" />
              <span>Operating Systems</span>
            </div>
            <div className="space-y-2 pt-2">
              {Object.keys(analytics.operating_systems).length === 0 ? (
                <div className="text-xs text-slate-500 italic">No OS data yet</div>
              ) : (
                Object.entries(analytics.operating_systems).map(([os, count]) => {
                  const pct = analytics.total_scans > 0 ? Math.round((count / analytics.total_scans) * 100) : 0;
                  return (
                    <div key={os} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>{os}</span>
                        <span className="font-mono text-slate-400">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Scans Audit Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recent Scan Events Log
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {analytics?.recent_scans.length || 0} recent hits
          </span>
        </div>

        {analytics && analytics.recent_scans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 bg-slate-950/20">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Device</th>
                  <th className="py-3 px-4">Browser / OS</th>
                  <th className="py-3 px-4">Referrer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {analytics.recent_scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-4 text-slate-300 font-sans">
                      {new Date(scan.scanned_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">{scan.ip}</td>
                    <td className="py-2.5 px-4 text-slate-300 font-sans">{scan.country}</td>
                    <td className="py-2.5 px-4 font-sans">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-300">
                        {scan.device}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 font-sans">
                      {scan.browser} on {scan.os}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 truncate max-w-[150px]">
                      {scan.referrer || 'Direct'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            No scans recorded yet for this QR code. Click &quot;Trigger Test Scan&quot; above to generate your first scan event!
          </div>
        )}
      </div>
    </div>
  );
}
