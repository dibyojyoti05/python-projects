"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import {
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Database,
  Globe,
  Layers,
  Bot,
  X,
  FileSpreadsheet,
  FileCode,
  Zap,
  Activity,
  Search
} from "lucide-react";

interface ScraperProject {
  id: string;
  name: string;
  description: string | null;
  start_url: string;
  scraper_type: string;
  max_depth: number;
  proxy: string | null;
  extraction_schema: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  total_jobs: number;
  latest_job_status: string;
}

interface ScrapeJob {
  id: string;
  scraper_id: string;
  scraper_name: string;
  status: string;
  total_pages: number;
  extracted_records_count: number;
  error_message: string | null;
  duration_ms: number;
  started_at: string;
  completed_at: string | null;
}

interface DashboardStats {
  total_scrapers: number;
  active_jobs: number;
  completed_jobs: number;
  pages_scraped_today: number;
  extracted_records_total: number;
  success_rate: number;
}

interface ExtractedRecord {
  id: string;
  source_url: string;
  data: Record<string, unknown>;
  crawled_at: string;
}

interface SchemaFieldRow {
  name: string;
  type: string;
  selector: string;
  attribute: string;
}

interface CopilotResponse {
  response: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [scrapers, setScrapers] = useState<ScraperProject[]>([]);
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Scraper Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startUrl, setStartUrl] = useState("");
  const [scraperType, setScraperType] = useState("http");
  const [maxDepth, setMaxDepth] = useState(1);
  const [fieldRows, setFieldRows] = useState<SchemaFieldRow[]>([
    { name: "title", type: "css", selector: "h1, .title, a", attribute: "text" },
    { name: "link", type: "css", selector: "a", attribute: "href" }
  ]);
  const [aiTargetFields, setAiTargetFields] = useState("title, price, link");
  const [aiDetecting, setAiDetecting] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Records Viewer Modal
  const [viewerJob, setViewerJob] = useState<ScrapeJob | null>(null);
  const [records, setRecords] = useState<ExtractedRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordSearch, setRecordSearch] = useState("");

  // AI Copilot Drawer
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotPrompt, setCopilotPrompt] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<Array<{ sender: "user" | "gemini"; text: string }>>([
    {
      sender: "gemini",
      text: "Hello! I am your Google Gemini Scraping Copilot. Need advice on selectors, bypassing bot protections, or regex patterns?"
    }
  ]);

  // Load dashboard data
  const loadData = useCallback(async () => {
    try {
      const [statsData, scrapersData, jobsData] = await Promise.all([
        fetchApi<DashboardStats>("/dashboard/stats"),
        fetchApi<ScraperProject[]>("/scrapers/"),
        fetchApi<ScrapeJob[]>("/jobs/")
      ]);
      setStats(statsData);
      setScrapers(scrapersData || []);
      setJobs(jobsData || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchInitial = async () => {
      try {
        const [statsData, scrapersData, jobsData] = await Promise.all([
          fetchApi<DashboardStats>("/dashboard/stats"),
          fetchApi<ScraperProject[]>("/scrapers/"),
          fetchApi<ScrapeJob[]>("/jobs/")
        ]);
        if (!isMounted) return;
        setStats(statsData);
        setScrapers(scrapersData || []);
        setJobs(jobsData || []);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    void fetchInitial();

    const interval = setInterval(() => {
      void fetchInitial();
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Trigger scrape run
  const handleRunScraper = async (scraperId: string) => {
    try {
      await fetchApi(`/jobs/${scraperId}/run`, { method: "POST" });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert("Failed to trigger job: " + msg);
    }
  };

  // Delete scraper
  const handleDeleteScraper = async (scraperId: string) => {
    if (!confirm("Are you sure you want to delete this scraper and its job history?")) return;
    try {
      await fetchApi(`/scrapers/${scraperId}`, { method: "DELETE" });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert("Failed to delete scraper: " + msg);
    }
  };

  // Open records viewer
  const handleViewRecords = async (job: ScrapeJob) => {
    setViewerJob(job);
    setRecordsLoading(true);
    try {
      const recs = await fetchApi<ExtractedRecord[]>(`/jobs/${job.id}/records`);
      setRecords(recs || []);
    } catch (err) {
      console.error("Failed to load records:", err);
    } finally {
      setRecordsLoading(false);
    }
  };

  // Direct CSV / JSON download
  const handleExport = (jobId: string, format: "csv" | "json") => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    window.open(`${apiUrl}/jobs/${jobId}/export?format=${format}`, "_blank");
  };

  // AI Selector Auto-Detect with Gemini
  const handleAiAutoDetect = async () => {
    if (!startUrl) {
      alert("Please enter a Target URL first!");
      return;
    }
    setAiDetecting(true);
    try {
      const targetFieldsList = aiTargetFields
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const suggestions = await fetchApi<Record<string, string>>("/ai/suggest-selectors", {
        method: "POST",
        body: JSON.stringify({
          url: startUrl,
          target_fields: targetFieldsList.length > 0 ? targetFieldsList : ["title", "price", "link"]
        })
      });

      if (suggestions && typeof suggestions === "object") {
        const newRows: SchemaFieldRow[] = Object.entries(suggestions).map(([fieldName, selector]) => ({
          name: fieldName,
          type: String(selector).startsWith("//") ? "xpath" : "css",
          selector: String(selector),
          attribute: fieldName.toLowerCase().includes("link") || fieldName.toLowerCase().includes("url") ? "href" : "text"
        }));

        setFieldRows(newRows);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert("Gemini auto-detect error: " + msg);
    } finally {
      setAiDetecting(false);
    }
  };

  // Create Scraper Submit
  const handleCreateScraper = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    const schemaObj: Record<string, unknown> = {};
    for (const row of fieldRows) {
      if (row.name.trim() && row.selector.trim()) {
        schemaObj[row.name.trim()] = {
          type: row.type,
          selector: row.selector.trim(),
          attribute: row.attribute.trim() || "text"
        };
      }
    }

    try {
      await fetchApi("/scrapers/", {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          start_url: startUrl,
          scraper_type: scraperType,
          max_depth: Number(maxDepth) || 1,
          extraction_schema: schemaObj
        })
      });

      setIsModalOpen(false);
      setName("");
      setDescription("");
      setStartUrl("");
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert("Failed to create scraper: " + msg);
    } finally {
      setCreateLoading(false);
    }
  };

  // Copilot Ask
  const handleCopilotSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotPrompt.trim() || copilotLoading) return;

    const userText = copilotPrompt;
    setCopilotMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setCopilotPrompt("");
    setCopilotLoading(true);

    try {
      const res = await fetchApi<CopilotResponse>("/ai/copilot", {
        method: "POST",
        body: JSON.stringify({
          prompt: userText,
          context: startUrl ? `Target URL: ${startUrl}` : undefined
        })
      });
      setCopilotMessages((prev) => [...prev, { sender: "gemini", text: res?.response || "Done." }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reach Gemini.";
      setCopilotMessages((prev) => [
        ...prev,
        { sender: "gemini", text: `Error: ${msg}` }
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Filter records for viewer
  const filteredRecords = records.filter((r) => {
    if (!recordSearch.trim()) return true;
    const str = JSON.stringify(r.data).toLowerCase();
    return str.includes(recordSearch.toLowerCase());
  });

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Loading Platform State...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Enterprise Web Scraper
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Gemini AI Powered
              </span>
            </h1>
            <p className="text-xs text-slate-400">PostgreSQL Engine & Stealth Crawler</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setRefreshing(true);
              loadData();
            }}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl transition-all border border-slate-700/60"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
          </button>

          <button
            onClick={() => setIsCopilotOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded-xl transition-all shadow-sm"
          >
            <Bot className="w-4 h-4 text-violet-400" />
            AI Copilot
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Scraper
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Projects</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-3xl font-extrabold text-white">{stats?.total_scrapers ?? 0}</p>
            <span className="text-[11px] text-slate-500">Configured scrapers</span>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Running Jobs</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-extrabold text-amber-400">{stats?.active_jobs ?? 0}</p>
            <span className="text-[11px] text-slate-500">Executing tasks</span>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Pages Scraped</span>
              <Globe className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-3xl font-extrabold text-blue-400">{stats?.pages_scraped_today ?? 0}</p>
            <span className="text-[11px] text-slate-500">Pages crawled today</span>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Stored Records</span>
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold text-emerald-400">{stats?.extracted_records_total ?? 0}</p>
            <span className="text-[11px] text-slate-500">Rows in PostgreSQL</span>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Success Rate</span>
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-3xl font-extrabold text-green-400">{stats?.success_rate ?? 100}%</p>
            <span className="text-[11px] text-slate-500">Zero error target</span>
          </div>
        </div>

        {/* Scraper Projects Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Scraper Projects</h2>
              <p className="text-xs text-slate-400">Target sites, extraction schemas, and live execution</p>
            </div>
          </div>

          {scrapers.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
              <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-300">No scraper projects found.</p>
              <p className="text-xs text-slate-500 mt-1">Click &quot;New Scraper&quot; above to create your first target.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {scrapers.map((sc) => {
                const schemaKeys = Object.keys(sc.extraction_schema || {});
                return (
                  <div
                    key={sc.id}
                    className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-white text-base leading-tight">{sc.name}</h3>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            sc.scraper_type === "playwright"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                              : sc.scraper_type === "crawler"
                              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {sc.scraper_type === "playwright"
                            ? "Headless Playwright"
                            : sc.scraper_type === "crawler"
                            ? "Multi-Page Spider"
                            : "Fast HTTP"}
                        </span>
                      </div>

                      {sc.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">{sc.description}</p>
                      )}

                      <div className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 break-all">
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        <a href={sc.start_url} target="_blank" rel="noreferrer" className="truncate hover:underline">
                          {sc.start_url}
                        </a>
                      </div>

                      {/* Fields badge */}
                      <div className="pt-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                          Extracted Fields ({schemaKeys.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {schemaKeys.map((k) => (
                            <span
                              key={k}
                              className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60 font-mono"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRunScraper(sc.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-sm transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Run Now
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteScraper(sc.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete Scraper"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Jobs History Table */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Execution Audit Log</h2>
            <p className="text-xs text-slate-400">Real-time status, record counts, and file downloads</p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/50 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Scraper Target</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Extracted Rows</th>
                    <th className="px-5 py-3.5">Duration</th>
                    <th className="px-5 py-3.5">Started At</th>
                    <th className="px-5 py-3.5 text-right">Data Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                        No jobs executed yet. Click &quot;Run Now&quot; on any scraper above!
                      </td>
                    </tr>
                  ) : (
                    jobs.map((j) => (
                      <tr key={j.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="px-5 py-4 font-semibold text-white">{j.scraper_name}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] tracking-wider border ${
                              j.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : j.status === "running"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            }`}
                          >
                            {j.status === "completed" && <CheckCircle2 className="w-3 h-3" />}
                            {j.status === "running" && <Clock className="w-3 h-3 animate-spin" />}
                            {j.status === "failed" && <AlertCircle className="w-3 h-3" />}
                            {j.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono font-medium text-slate-200">
                          {j.extracted_records_count} records
                        </td>
                        <td className="px-5 py-4 font-mono text-slate-400">
                          {j.duration_ms ? `${(j.duration_ms / 1000).toFixed(2)}s` : "-"}
                        </td>
                        <td className="px-5 py-4 text-slate-400">
                          {new Date(j.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleViewRecords(j)}
                              className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg border border-slate-700/60 transition-colors"
                            >
                              Inspect Rows
                            </button>
                            <button
                              onClick={() => handleExport(j.id, "csv")}
                              className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                              title="Download CSV"
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleExport(j.id, "json")}
                              className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                              title="Download JSON"
                            >
                              <FileCode className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* New Scraper Studio Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Create Scraper Project
                </h3>
                <p className="text-xs text-slate-400">Configure your target URL and extraction rules</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateScraper} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amazon Laptops Catalog"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Engine Type</label>
                  <select
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={scraperType}
                    onChange={(e) => setScraperType(e.target.value)}
                  >
                    <option value="http">Fast HTTP (httpx)</option>
                    <option value="playwright">Headless Playwright (Dynamic JavaScript / SPAs)</option>
                    <option value="crawler">Multi-Page Spider (Recursive Crawler)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Target Seed URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/products"
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={startUrl}
                  onChange={(e) => setStartUrl(e.target.value)}
                />
              </div>

              {scraperType === "crawler" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Max Crawl Depth</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(Number(e.target.value))}
                  />
                </div>
              )}

              {/* Gemini Auto-Detect Box */}
              <div className="p-4 bg-gradient-to-r from-indigo-950/40 to-violet-950/40 border border-indigo-800/40 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Gemini AI Selector Auto-Detector
                  </span>
                  <button
                    type="button"
                    disabled={aiDetecting || !startUrl}
                    onClick={handleAiAutoDetect}
                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-all"
                  >
                    {aiDetecting ? "Analyzing DOM with Gemini..." : "Auto-Detect Selectors"}
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Target fields (comma separated): title, price, image, rating"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  value={aiTargetFields}
                  onChange={(e) => setAiTargetFields(e.target.value)}
                />
                <p className="text-[11px] text-slate-400">
                  Gemini will fetch the target page and automatically determine the cleanest CSS/XPath selectors.
                </p>
              </div>

              {/* Extraction Schema Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Extraction Fields Schema</label>
                  <button
                    type="button"
                    onClick={() =>
                      setFieldRows([...fieldRows, { name: "", type: "css", selector: "", attribute: "text" }])
                    }
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    + Add Field
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {fieldRows.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Field Name"
                        className="w-1/4 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                        value={row.name}
                        onChange={(e) => {
                          const copy = [...fieldRows];
                          copy[idx].name = e.target.value;
                          setFieldRows(copy);
                        }}
                      />
                      <select
                        className="w-1/5 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                        value={row.type}
                        onChange={(e) => {
                          const copy = [...fieldRows];
                          copy[idx].type = e.target.value;
                          setFieldRows(copy);
                        }}
                      >
                        <option value="css">CSS</option>
                        <option value="xpath">XPath</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Selector (e.g. h1.title)"
                        className="w-2/5 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono"
                        value={row.selector}
                        onChange={(e) => {
                          const copy = [...fieldRows];
                          copy[idx].selector = e.target.value;
                          setFieldRows(copy);
                        }}
                      />
                      <input
                        type="text"
                        placeholder="attr (text/href)"
                        className="w-1/6 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono"
                        value={row.attribute}
                        onChange={(e) => {
                          const copy = [...fieldRows];
                          copy[idx].attribute = e.target.value;
                          setFieldRows(copy);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setFieldRows(fieldRows.filter((_, i) => i !== idx))}
                        className="p-1 text-slate-500 hover:text-rose-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/25 disabled:opacity-50"
                >
                  {createLoading ? "Saving Project..." : "Save Scraper"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extracted Records Viewer Modal */}
      {viewerJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  Extracted Data Records: {viewerJob.scraper_name}
                </h3>
                <p className="text-xs text-slate-400">Job ID: {viewerJob.id} | Total Rows: {records.length}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport(viewerJob.id, "csv")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download CSV
                </button>
                <button
                  onClick={() => handleExport(viewerJob.id, "json")}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download JSON
                </button>
                <button onClick={() => setViewerJob(null)} className="p-1.5 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search within extracted records..."
                className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={recordSearch}
                onChange={(e) => setRecordSearch(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-auto border border-slate-800 rounded-xl">
              {recordsLoading ? (
                <div className="p-12 text-center text-slate-400">Loading records from PostgreSQL...</div>
              ) : filteredRecords.length === 0 ? (
                <div className="p-12 text-center text-slate-500">No records found matching your search.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 sticky top-0 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      {Object.keys(filteredRecords[0]?.data || {}).map((col) => (
                        <th key={col} className="px-4 py-3 font-semibold text-slate-300">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {filteredRecords.map((r, i) => (
                      <tr key={r.id} className="hover:bg-slate-800/40">
                        <td className="px-4 py-2.5 text-slate-500">{i + 1}</td>
                        {Object.keys(filteredRecords[0]?.data || {}).map((col) => (
                          <td key={col} className="px-4 py-2.5 text-slate-200 max-w-xs truncate">
                            {String(r.data[col] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Copilot Drawer */}
      {isCopilotOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Gemini Scraping Copilot</h3>
                <span className="text-[10px] text-slate-400">Live AI Scraping Advisor</span>
              </div>
            </div>
            <button onClick={() => setIsCopilotOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {copilotMessages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl text-xs ${
                  m.sender === "user"
                    ? "bg-indigo-600 text-white ml-6 rounded-tr-none"
                    : "bg-slate-800/90 text-slate-200 mr-6 border border-slate-700/60 rounded-tl-none whitespace-pre-wrap"
                }`}
              >
                {m.text}
              </div>
            ))}
            {copilotLoading && (
              <div className="p-3 bg-slate-800/60 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                Gemini is thinking...
              </div>
            )}
          </div>

          <form onSubmit={handleCopilotSend} className="p-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              placeholder="Ask about selectors, regex, or tips..."
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={copilotPrompt}
              onChange={(e) => setCopilotPrompt(e.target.value)}
            />
            <button
              type="submit"
              disabled={copilotLoading}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
            >
              Ask
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
