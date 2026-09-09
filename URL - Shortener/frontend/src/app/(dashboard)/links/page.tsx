"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { 
  Plus, MoreVertical, Star, Copy, ExternalLink, Activity, 
  QrCode, BarChart3, Trash2, Check, CheckCircle2 
} from "lucide-react";
import Link from "next/link";

interface LinkItem {
  id: string;
  original_url: string;
  short_code: string;
  custom_slug: string | null;
  is_active: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  created_at?: string;
  click_count?: number;
}

export default function LinksPage() {
  const { activeOrgId } = useAuthStore();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (activeOrgId) {
      fetchLinks();
    }
  }, [activeOrgId]);

  const fetchLinks = async () => {
    try {
      const response = await api.get(`/links/?organization_id=${activeOrgId}`);
      setLinks(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/links/${id}`, { is_favorite: !currentStatus });
      fetchLinks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this short link?")) return;
    try {
      await api.delete(`/links/${id}`);
      setLinks(prev => prev.filter(l => l.id !== id));
      setMenuOpenId(null);
    } catch (err) {
      alert("Failed to delete link");
    }
  };

  const copyToClipboard = (shortCode: string, id: string) => {
    const url = `${window.location.origin}/${shortCode}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Links</h1>
          <p className="text-gray-500 text-sm mt-1">Manage, analyze, and track your active short links.</p>
        </div>
        <Link href="/links/new">
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg shadow-sm font-medium transition">
            <Plus size={18} />
            Create Link
          </button>
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading links...</div>
        ) : links.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="text-gray-400">No links created yet in this workspace.</div>
            <Link href="/links/new">
              <button className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                Create your first link →
              </button>
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {links.map((link) => {
              const code = link.custom_slug || link.short_code;
              const isMenuOpen = menuOpenId === link.id;

              return (
                <li key={link.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-750 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <button onClick={() => toggleFavorite(link.id, link.is_favorite)} className="text-gray-400 hover:text-yellow-500">
                      <Star size={20} className={link.is_favorite ? "fill-yellow-500 text-yellow-500" : ""} />
                    </button>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-base hover:underline cursor-pointer" onClick={() => copyToClipboard(code, link.id)}>
                          {typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}/{code}
                        </span>
                        <button 
                          onClick={() => copyToClipboard(code, link.id)} 
                          title="Copy Link" 
                          className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300"
                        >
                          {copiedId === link.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
                        {copiedId === link.id && (
                          <span className="text-xs text-green-600 font-medium animate-fade-in">Copied!</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1 truncate max-w-xl">
                        <ExternalLink size={14} className="flex-shrink-0" />
                        <span className="truncate">{link.original_url}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 justify-between md:justify-end">
                    <div className="flex flex-col items-end text-sm text-gray-500">
                      <span className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200">
                        <Activity size={16} className="text-indigo-500" /> {link.click_count ?? 0} {link.click_count === 1 ? 'click' : 'clicks'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {link.created_at ? new Date(link.created_at).toLocaleDateString() : 'Active'}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 relative">
                      <Link href={`/links/${link.id}/qr`} title="QR Code">
                        <button className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                          <QrCode size={18} />
                        </button>
                      </Link>

                      <Link href={`/analytics`} title="Analytics">
                        <button className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                          <BarChart3 size={18} />
                        </button>
                      </Link>

                      <button 
                        onClick={() => handleDelete(link.id)} 
                        title="Delete Link"
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
