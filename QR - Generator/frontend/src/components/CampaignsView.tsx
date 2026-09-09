"use client";

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Calendar, QrCode, AlertCircle, RefreshCw } from 'lucide-react';
import { api, Campaign } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface CampaignsViewProps {
  onOpenAuth: () => void;
}

export default function CampaignsView({ onOpenAuth }: CampaignsViewProps) {
  const { isAuthenticated } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!isAuthenticated) return;

    api.listCampaigns()
      .then((data) => {
        if (isMounted) setCampaigns(data);
      })
      .catch((err) => console.error(err));

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await api.createCampaign({ name, description });
      setCampaigns((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setName('');
      setDescription('');
    } catch (err) {
      console.error(err);
      alert('Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await api.deleteCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center mb-4">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Sign In to Organize Campaigns</h2>
        <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
          Group QR codes into marketing campaigns, track holistic traffic, and manage multi-channel attribution.
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Marketing Campaigns
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize and segment your dynamic QR codes across cross-channel initiatives.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
          <span className="text-xs">Loading campaigns...</span>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
          <AlertCircle className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-medium">No campaigns created yet.</p>
          <p className="text-xs text-slate-500 mt-1">Create your first campaign to group your QR codes.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
          >
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Layers className="w-5 h-5" />
                  </div>
                  <button
                    onClick={() => handleDelete(camp.id)}
                    title="Delete Campaign"
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">{camp.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {camp.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-indigo-400 font-semibold">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{camp.qr_count} Assigned QRs</span>
                </div>
                {camp.created_at && (
                  <div className="flex items-center space-x-1 text-slate-500 text-[11px]">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(camp.created_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8">
            <h3 className="text-xl font-bold text-white tracking-tight">Create New Campaign</h3>
            <p className="text-xs text-slate-400 mt-1">
              Define a campaign to track and cluster related QR codes.
            </p>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q3 Product Launch"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Goals, target channels, or campaign duration..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
