"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { Link as LinkIcon, Settings2, Globe, Clock, MousePointer, Smartphone } from "lucide-react";

export default function CreateLinkPage() {
  const { activeOrgId } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [originalUrl, setOriginalUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [clickLimit, setClickLimit] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Device routing
  const [iosUrl, setIosUrl] = useState("");
  const [androidUrl, setAndroidUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const deviceRouting: Record<string, string> = {};
      if (iosUrl) deviceRouting["mobile"] = iosUrl;
      if (androidUrl) deviceRouting["android"] = androidUrl;

      await api.post("/links/", {
        original_url: originalUrl,
        custom_slug: customSlug || null,
        password: password || null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        click_limit: clickLimit ? parseInt(clickLimit, 10) : null,
        device_routing: Object.keys(deviceRouting).length > 0 ? deviceRouting : null,
        organization_id: activeOrgId
      });
      router.push("/links");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create New Link</h1>
        <p className="text-gray-500">Shorten a URL and configure advanced routing options.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Destination URL
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="url"
                required
                placeholder="https://example.com/very/long/url"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-900 dark:border-gray-600 dark:text-white sm:text-sm"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Custom Slug (Optional)
              </label>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400">
                  localhost:3000/
                </span>
                <input
                  type="text"
                  placeholder="my-custom-slug"
                  className="flex-1 block w-full min-w-0 rounded-none rounded-r-md sm:text-sm border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-900 dark:border-gray-600 dark:text-white px-3 py-2 border"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password Protection (Optional)
              </label>
              <input
                type="password"
                placeholder="Leave blank for public link"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 dark:bg-gray-900 dark:border-gray-600 dark:text-white sm:text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Toggle Advanced Controls */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <Settings2 size={16} />
              {showAdvanced ? "Hide Advanced Options" : "Show Advanced Routing & Expiration"}
            </button>

            {showAdvanced && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 dark:bg-gray-850 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Clock size={14} className="text-gray-400" /> Expiration Date
                  </label>
                  <input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-xs bg-white dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <MousePointer size={14} className="text-gray-400" /> Maximum Clicks Allowed
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 500"
                    value={clickLimit}
                    onChange={(e) => setClickLimit(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-xs bg-white dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Smartphone size={14} className="text-gray-400" /> Mobile / iOS Destination URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://apps.apple.com/app/..."
                    value={iosUrl}
                    onChange={(e) => setIosUrl(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-xs bg-white dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition"
          >
            {loading ? "Generating..." : "Generate Short Link"}
          </button>
        </div>
      </form>
    </div>
  );
}
