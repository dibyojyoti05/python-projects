"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { Key, Plus, Trash2, Shield, Eye, EyeOff, Terminal, Copy, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const { activeOrgId } = useAuthStore();
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // New Key State
  const [newKeyName, setNewKeyName] = useState("");
  const [isProduction, setIsProduction] = useState(true);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (activeOrgId) {
      fetchKeys();
    }
  }, [activeOrgId]);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api-keys/?organization_id=${activeOrgId}`);
      setKeys(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/api-keys/", {
        name: newKeyName,
        organization_id: activeOrgId,
        is_production: isProduction
      });
      setGeneratedKey(res.data.raw_key);
      setNewKeyName("");
      fetchKeys(); // Refresh list
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create API key");
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this key? Any scripts using it will instantly fail.")) return;
    try {
      await api.delete(`/api-keys/${keyId}`);
      fetchKeys();
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!activeOrgId) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Terminal className="text-indigo-600" size={32} />
          Developer Hub
        </h1>
        <p className="text-gray-500 mt-2">Manage your programmatic access keys and configure webhooks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create API Key */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Generate API Key</h3>
            <form onSubmit={handleCreateKey} className="space-y-4">
              {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key Name</label>
                <input
                  type="text"
                  required
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 dark:text-white sm:text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g. Zapier Integration"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Environment</label>
                <select
                  value={isProduction ? "true" : "false"}
                  onChange={(e) => setIsProduction(e.target.value === "true")}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-900 dark:text-white sm:text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="true">Production (Live routing)</option>
                  <option value="false">Test (Sandbox)</option>
                </select>
              </div>
              
              <button
                type="submit"
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus size={16} /> Generate Key
              </button>
            </form>
          </div>
        </div>

        {/* API Key List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Success Banner */}
          {generatedKey && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 rounded-xl relative">
              <h3 className="text-green-800 dark:text-green-400 font-bold mb-2 flex items-center gap-2">
                <CheckCircle size={20} /> Key Generated Successfully
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                Please copy this key immediately. You will not be able to see it again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white dark:bg-gray-900 p-3 rounded-lg border border-green-200 dark:border-green-700 font-mono text-sm text-gray-800 dark:text-gray-200 break-all">
                  {generatedKey}
                </code>
                <button 
                  onClick={copyToClipboard}
                  className="p-3 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-gray-700 transition"
                >
                  {copied ? <CheckCircle className="text-green-600" size={20} /> : <Copy className="text-gray-500" size={20} />}
                </button>
              </div>
              <button 
                onClick={() => setGeneratedKey(null)}
                className="absolute top-4 right-4 text-green-700 hover:text-green-900 text-sm font-medium"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <Key className="text-gray-500" size={20} />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active API Keys</h3>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading keys...</div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {keys.map((k) => (
                  <li key={k.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">{k.name}</p>
                      <div className="flex items-center gap-3 text-sm">
                        <code className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded font-mono">
                          {k.key_prefix}****************
                        </code>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">
                          {k.last_used_at ? `Used ${new Date(k.last_used_at).toLocaleDateString()}` : "Never used"}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRevoke(k.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                      title="Revoke Key"
                    >
                      <Trash2 size={20} />
                    </button>
                  </li>
                ))}
                {keys.length === 0 && (
                  <li className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
                    <Shield size={32} className="opacity-20" />
                    <span>No API keys found.</span>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
