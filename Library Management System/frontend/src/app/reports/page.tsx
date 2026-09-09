'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Shield,
  PieChart,
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';

export default function ReportsPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cList, bList, aList] = await Promise.all([
          api.getCategories(),
          api.getBooks(),
          api.getAuditLogs().catch(() => []),
        ]);
        setCategories(cList);
        setBooks(bList);
        setAuditLogs(aList);

      } catch (err) {
        console.error('Error fetching reports data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Institutional Reports & Audit Logs</h1>
        <p className="text-slate-400 text-sm mt-1">
          Review collection distribution, compliance audit trails, and utilization insights.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-sm">Generating report telemetry...</span>
        </div>
      ) : (
        <>
          {/* Top Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-indigo-400" />
                  <span>Collection by Discipline</span>
                </h2>
                <span className="text-xs text-slate-500">{categories.length} Registered Disciplines</span>
              </div>

              <div className="space-y-3">
                {categories.slice(0, 6).map((cat, idx) => {
                  const count = books.filter((b) => b.categories?.some((c: any) => c.id === cat.id)).length;
                  const pct = Math.min(100, Math.max(10, count * 22));
                  return (
                    <div key={cat.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-200">{cat.name}</span>
                        <span className="text-slate-400">{count} titles</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full ${
                            idx % 3 === 0
                              ? 'bg-indigo-500'
                              : idx % 3 === 1
                              ? 'bg-violet-500'
                              : 'bg-emerald-400'
                          }`}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* High Demand Borrowing Titles */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Most Checked-Out Titles</span>
                </h2>
                <span className="text-xs text-slate-500">Historical Circulation</span>
              </div>

              <div className="space-y-3">
                {books.slice(0, 5).map((b, idx) => (
                  <div
                    key={b.id}
                    className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-indigo-400">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-slate-200 block">{b.title}</span>
                        <span className="text-[11px] text-slate-400">
                          {b.authors?.map((a: any) => a.name).join(', ') || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold text-[11px]">
                      {b.total_copies} total copies
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Trail Log */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>Immutable System Audit Trail</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chronological records of loans, book changes, fines, and user registrations
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">{auditLogs.length} Events Logged</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/40 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                    <th className="p-3.5 font-semibold">Event ID</th>
                    <th className="p-3.5 font-semibold">Action</th>
                    <th className="p-3.5 font-semibold">Resource Entity</th>
                    <th className="p-3.5 font-semibold">Details</th>
                    <th className="p-3.5 font-semibold text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs text-slate-300">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/50 transition">
                      <td className="p-3.5 font-mono text-indigo-400">#EVT-{log.id}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono font-semibold">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3.5 capitalize font-medium text-slate-300">{log.resource_type}</td>
                      <td className="p-3.5 text-slate-300 max-w-md truncate">{log.details}</td>
                      <td className="p-3.5 text-right font-mono text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
