"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, ExternalLink, Copy, Check, BarChart2, Edit3, 
  Trash2, Download, Power, RefreshCw, QrCode as QrIcon, 
  AlertCircle, Plus 
} from 'lucide-react';
import { api, QRCodeItem } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface QRDashboardProps {
  onSelectAnalytics: (qrId: string) => void;
  onNavigateStudio: () => void;
  onOpenAuth: () => void;
}

export default function QRDashboard({ onSelectAnalytics, onNavigateStudio, onOpenAuth }: QRDashboardProps) {
  const { isAuthenticated } = useAuth();
  const [qrs, setQrs] = useState<QRCodeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DYNAMIC' | 'STATIC'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Modal state
  const [editingQR, setEditingQR] = useState<QRCodeItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchQRs = async () => {
    if (!isAuthenticated) {
      return;
    }
    setLoading(true);
    try {
      const data = await api.listQRs();
      setQrs(data);
    } catch (err) {
      console.error('Failed to list QRs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!isAuthenticated) return;

    api.listQRs()
      .then((data) => {
        if (isMounted) setQrs(data);
      })
      .catch((err) => console.error('Failed to list QRs', err));

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleActive = async (qr: QRCodeItem) => {
    try {
      const updated = await api.updateQR(qr.id, { is_active: !qr.is_active });
      setQrs((prev) => prev.map((q) => (q.id === qr.id ? updated : q)));
    } catch (err) {
      console.error('Failed to toggle active state', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this QR code? Dynamic redirects will stop working.')) return;
    try {
      await api.deleteQR(id);
      setQrs((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      console.error('Failed to delete QR', err);
    }
  };

  const openEditModal = (qr: QRCodeItem) => {
    setEditingQR(qr);
    setEditName(qr.name);
    setEditUrl(qr.destination_url || qr.raw_data || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQR) return;
    setIsSavingEdit(true);
    try {
      const updated = await api.updateQR(editingQR.id, {
        name: editName,
        destination_url: editingQR.is_dynamic ? editUrl : undefined,
        raw_data: !editingQR.is_dynamic ? editUrl : undefined,
      });
      setQrs((prev) => prev.map((q) => (q.id === editingQR.id ? updated : q)));
      setEditingQR(null);
    } catch (err) {
      console.error('Failed to update QR', err);
      alert('Failed to update destination');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const filteredQrs = qrs.filter((qr) => {
    const matchesSearch = qr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (qr.destination_url && qr.destination_url.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;
    if (filterType === 'DYNAMIC') return qr.is_dynamic;
    if (filterType === 'STATIC') return !qr.is_dynamic;
    return true;
  });

  const totalScans = qrs.reduce((acc, q) => acc + (q.scan_count || 0), 0);
  const activeDynamics = qrs.filter((q) => q.is_dynamic && q.is_active).length;

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center mb-4">
          <QrIcon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Sign In to Access Your Dashboard</h2>
        <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
          Manage your live campaigns, update redirect destinations, and monitor scan analytics in real-time.
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total QR Codes</div>
          <div className="text-3xl font-black text-white mt-2">{qrs.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Generated & Managed</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Scans</div>
          <div className="text-3xl font-black text-indigo-400 mt-2">{totalScans}</div>
          <div className="text-[11px] text-slate-500 mt-1">Audit-logged scans</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Dynamic Links</div>
          <div className="text-3xl font-black text-emerald-400 mt-2">{activeDynamics}</div>
          <div className="text-[11px] text-slate-500 mt-1">Editable destination URLs</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Quick Actions</div>
            <div className="text-sm font-medium text-slate-200 mt-1">Create New Asset</div>
          </div>
          <button
            onClick={onNavigateStudio}
            className="mt-3 py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Launch Generator</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by QR name or URL..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {(['ALL', 'DYNAMIC', 'STATIC'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === type
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
              }`}
            >
              {type}
            </button>
          ))}
          <button
            onClick={fetchQRs}
            title="Refresh List"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table of QR Codes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
            <span className="text-xs">Loading QR codes...</span>
          </div>
        ) : filteredQrs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium">No QR codes found.</p>
            <p className="text-xs text-slate-500 mt-1">Start by creating your first QR in the Studio.</p>
            <button
              onClick={onNavigateStudio}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Create QR Code
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                  <th className="py-3.5 px-4">Preview</th>
                  <th className="py-3.5 px-4">Name & Type</th>
                  <th className="py-3.5 px-4">Dynamic Link</th>
                  <th className="py-3.5 px-4">Target Destination</th>
                  <th className="py-3.5 px-4 text-center">Total Scans</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredQrs.map((qr) => {
                  const redirectUrl = qr.short_code ? api.getRedirectUrl(qr.short_code) : '';
                  return (
                    <tr key={qr.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Image Thumbnail */}
                      <td className="py-3 px-4">
                        <div className="w-12 h-12 rounded-xl bg-white p-1 border border-slate-700 flex items-center justify-center shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={api.getImageUrl(qr.id, 'svg', 5)}
                            alt={qr.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </td>

                      {/* Name & Type */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white tracking-tight">{qr.name}</div>
                        <div className="flex items-center space-x-1.5 mt-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            qr.is_dynamic 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {qr.is_dynamic ? 'DYNAMIC' : 'STATIC'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono uppercase">
                            {qr.qr_type}
                          </span>
                        </div>
                      </td>

                      {/* Short Dynamic Link */}
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {qr.is_dynamic && qr.short_code ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="truncate max-w-[160px]">{redirectUrl}</span>
                            <button
                              onClick={() => handleCopy(redirectUrl, qr.id)}
                              title="Copy redirect link"
                              className="p-1 hover:text-indigo-400 text-slate-500 transition-colors"
                            >
                              {copiedId === qr.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <a
                              href={redirectUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Open link (triggers scan)"
                              className="p-1 hover:text-indigo-400 text-slate-500 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Direct QR Payload</span>
                        )}
                      </td>

                      {/* Destination */}
                      <td className="py-3 px-4 text-slate-300 max-w-[200px]">
                        <div className="truncate font-mono text-[11px]" title={qr.destination_url || qr.raw_data || ''}>
                          {qr.destination_url || qr.raw_data || '—'}
                        </div>
                      </td>

                      {/* Scans */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onSelectAnalytics(qr.id)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-colors cursor-pointer"
                        >
                          <span className="font-bold">{qr.scan_count || 0}</span>
                          <span className="text-[10px] text-indigo-300/70">scans</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(qr)}
                          title={qr.is_active ? 'Click to deactivate' : 'Click to activate'}
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                            qr.is_active
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{qr.is_active ? 'ACTIVE' : 'PAUSED'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {qr.is_dynamic && (
                            <button
                              onClick={() => openEditModal(qr)}
                              title="Edit Destination URL"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => onSelectAnalytics(qr.id)}
                            title="View Analytics"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                          >
                            <BarChart2 className="w-4 h-4" />
                          </button>
                          <a
                            href={api.getImageUrl(qr.id, 'png', 20)}
                            download={`${qr.name}.png`}
                            title="Download PNG"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDelete(qr.id)}
                            title="Delete QR"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Destination Modal */}
      {editingQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
            <h3 className="text-xl font-bold text-white tracking-tight">Edit Dynamic Destination</h3>
            <p className="text-xs text-slate-400 mt-1">
              Update the destination URL instantly. Anyone scanning this QR code will immediately be routed to the new destination.
            </p>

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">QR Label</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Destination URL</label>
                <input
                  type="url"
                  required
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingQR(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Destination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
