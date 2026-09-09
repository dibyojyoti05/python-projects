"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { Target, Plus, Tag, Link as LinkIcon, Download, Check, Folder, Layers } from "lucide-react";

export default function CampaignsPage() {
  const [folderName, setFolderName] = useState("");
  const [urls, setUrls] = useState("");
  
  // UTM Params
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [utmContent, setUtmContent] = useState("");

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<any>(null);

  const { activeOrgId } = useAuthStore();

  useEffect(() => {
    if (activeOrgId) {
      fetchCampaigns();
    }
  }, [activeOrgId]);

  const fetchCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      const res = await api.get(`/campaigns/?organization_id=${activeOrgId}`);
      setCampaigns(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(null);

    const urlList = urls.split('\n').map(u => u.trim()).filter(u => u);
    
    if (urlList.length === 0) {
      setError("Please provide at least one URL.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        organization_id: activeOrgId,
        folder_name: folderName,
        original_urls: urlList,
        utm: {
          utm_source: utmSource || null,
          utm_medium: utmMedium || null,
          utm_campaign: utmCampaign || null,
          utm_term: utmTerm || null,
          utm_content: utmContent || null
        }
      };

      const res = await api.post("/campaigns/bulk", payload);
      setSuccess(res.data);
      fetchCampaigns();
      
      // Clear form
      setUrls("");
      setFolderName("");
      setUtmSource("");
      setUtmMedium("");
      setUtmCampaign("");
      setUtmTerm("");
      setUtmContent("");
      
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to generate campaign");
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    if (!success) return;
    
    const rows = [
      ["Original URL", "Short Code", "Full Short URL"]
    ];
    
    success.links.forEach((l: any) => {
      rows.push([
        l.original_url, 
        l.short_code, 
        `${window.location.origin}/${l.short_code}`
      ]);
    });
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${success.campaign_folder}_links.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Target className="text-indigo-600" size={32} />
          Campaigns & Bulk Links
        </h1>
        <p className="text-gray-500 mt-2">Generate hundreds of UTM-tagged links at once grouped into trackable folders.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Bulk Link Generation Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Bulk Campaign</h2>
            
            {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</div>}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign Folder Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Q4 Black Friday Launch"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 dark:text-white sm:text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target URLs (One per line)</label>
              <textarea
                rows={4}
                required
                placeholder={"https://mybrand.com/shoes\nhttps://mybrand.com/shirts\nhttps://mybrand.com/hats"}
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 dark:text-white sm:text-sm focus:ring-indigo-500 focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">UTM Parameters (Automatically injected)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">utm_source</label>
                  <input
                    type="text"
                    placeholder="twitter, newsletter, google"
                    value={utmSource}
                    onChange={(e) => setUtmSource(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 dark:text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">utm_medium</label>
                  <input
                    type="text"
                    placeholder="cpc, social, email"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 dark:text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">utm_campaign</label>
                  <input
                    type="text"
                    placeholder="black_friday_2026"
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 dark:text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">utm_content</label>
                  <input
                    type="text"
                    placeholder="hero_banner"
                    value={utmContent}
                    onChange={(e) => setUtmContent(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 dark:text-white text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 transition"
              >
                {loading ? "Generating Links..." : "Generate Campaign Links"}
              </button>
            </div>
          </form>

          {/* Success Banner */}
          {success && (
            <div className="mt-6 p-6 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-300 font-semibold">
                  <Check className="p-1 bg-green-500 text-white rounded-full" size={20} />
                  <span>Campaign "{success.campaign_folder}" generated ({success.links_generated} links)!</span>
                </div>
                <button
                  onClick={downloadCsv}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-md shadow-sm transition"
                >
                  <Download size={14} /> Download CSV
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Existing Campaign Folders List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Folder className="text-indigo-600" size={20} />
              Active Campaigns
            </h2>

            {loadingCampaigns ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading campaigns...</div>
            ) : campaigns.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                No campaigns created yet. Create one to organize your links.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {campaigns.map((c) => (
                  <li key={c.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.link_count} {c.link_count === 1 ? 'link' : 'links'}</p>
                    </div>
                    <span className="text-xs bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-medium px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                      Active
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
