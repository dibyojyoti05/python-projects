import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  Loader2,
  Link2,
  FileText,
  Send,
  Database,
  BarChart3,
  History,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  ExternalLink,
  Flame,
  Scale,
  Zap
} from 'lucide-react';
import './App.css';

const API_BASE = 'http://localhost:8000/api';

function App() {
  const [activeTab, setActiveTab] = useState('detector'); // 'detector' | 'history' | 'analytics'
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [samples, setSamples] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [filterVerdict, setFilterVerdict] = useState('all');

  // Fetch initial samples, stats, and history on load
  useEffect(() => {
    fetchSamples();
    fetchStats();
    fetchHistory();
  }, []);

  const fetchSamples = async () => {
    try {
      const res = await fetch(`${API_BASE}/samples`);
      if (res.ok) setSamples(await res.json());
    } catch (err) {
      console.warn("Could not load sample articles:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats`);
      if (res.ok) setStats(await res.json());
    } catch (err) {
      console.warn("Could not load stats:", err);
    }
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE}/history`);
      if (res.ok) setHistory(await res.json());
    } catch (err) {
      console.warn("Could not load history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleAnalyze = async () => {
    if (!text || text.trim().length < 15) {
      setError("Please enter at least 15 characters of news text or a valid article URL.");
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setResult(null);
    setFeedbackSent(false);

    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to analyze content.");
      }

      const data = await response.json();
      setResult(data);
      // Refresh background stats and history
      fetchStats();
      fetchHistory();
    } catch (err) {
      setError(err.message || "Network error. Make sure the backend server is running on port 8000.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFeedback = async (vote) => {
    if (!result || feedbackSent) return;
    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis_id: result.id, vote }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult((prev) => ({
          ...prev,
          upvotes: data.upvotes,
          downvotes: data.downvotes,
        }));
        setFeedbackSent(true);
        fetchHistory();
      }
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    }
  };

  const handleDeleteHistory = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        if (result && result.id === id) setResult(null);
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to delete history record:", err);
    }
  };

  const handleCopyReport = () => {
    if (!result) return;
    const report = `TruthLens AI Verification Report
Verdict: ${result.verdict} (${result.confidence}% Confidence)
Sensationalism Score: ${result.sensationalism_score}/100
Editorial Bias: ${result.bias_rating}
Analysis: ${result.reasoning}
Red Flags: ${result.key_flags?.join(', ') || 'None'}
Credibility Factors: ${result.credibility_indicators?.join(', ') || 'None'}`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getVerdictStyle = (verdict) => {
    switch (verdict?.toLowerCase()) {
      case 'real':
        return {
          icon: <ShieldCheck size={36} className="text-emerald-400" />,
          color: 'text-emerald-400',
          badgeClass: 'badge-real',
          border: 'border-emerald-500/30',
          bgGlow: 'bg-emerald-500/10'
        };
      case 'fake':
        return {
          icon: <ShieldAlert size={36} className="text-rose-500" />,
          color: 'text-rose-500',
          badgeClass: 'badge-fake',
          border: 'border-rose-500/30',
          bgGlow: 'bg-rose-500/10'
        };
      case 'satire':
        return {
          icon: <AlertCircle size={36} className="text-amber-400" />,
          color: 'text-amber-400',
          badgeClass: 'badge-satire',
          border: 'border-amber-500/30',
          bgGlow: 'bg-amber-500/10'
        };
      default:
        return {
          icon: <HelpCircle size={36} className="text-slate-400" />,
          color: 'text-slate-400',
          badgeClass: 'badge-unverified',
          border: 'border-slate-500/30',
          bgGlow: 'bg-slate-500/10'
        };
    }
  };

  const filteredHistory = history.filter((item) => {
    if (filterVerdict === 'all') return true;
    return item.verdict.toLowerCase() === filterVerdict.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30 font-sans pb-16">
      {/* Background Decorative Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl glow-ambient"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl glow-ambient" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Navigation Bar */}
        <header className="flex flex-col sm:flex-row items-center justify-between py-6 border-b border-slate-800/80 gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/20">
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white">TruthLens</span>
                <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md">
                  AI Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-400">Generative Fake News Detection & Fact Verification</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Database connection badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 border border-slate-700/60 rounded-lg text-xs text-slate-300">
              <Database size={14} className="text-emerald-400" />
              <span>PostgreSQL :5433</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
              <button
                onClick={() => setActiveTab('detector')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'detector'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText size={14} />
                Detector
              </button>
              <button
                onClick={() => {
                  setActiveTab('history');
                  fetchHistory();
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'history'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <History size={14} />
                History
                {history.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-blue-900/80 text-blue-300 rounded-full text-[10px]">
                    {history.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab('analytics');
                  fetchStats();
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 size={14} />
                Analytics
              </button>
            </div>
          </div>
        </header>

        {/* TAB 1: DETECTOR */}
        {activeTab === 'detector' && (
          <div className="space-y-8">
            {/* Quick Demo Pre-sets */}
            <div className="glass-panel p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400" />
                  Instant 1-Click Test Scenarios:
                </span>
                <span className="text-[11px] text-slate-500">Click any preset to test immediately</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {samples.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setText(s.text);
                      setError(null);
                    }}
                    className="p-3 text-left glass-card hover:border-blue-500/50 group transition-all rounded-lg"
                  >
                    <div className="text-[11px] font-semibold text-blue-400 mb-1 group-hover:text-blue-300 flex items-center justify-between">
                      <span>{s.category}</span>
                      <Zap size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="text-xs font-medium text-slate-200 line-clamp-1">{s.title}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Input Form */}
              <div className="lg:col-span-7 space-y-4">
                <div className="glass-panel p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                      <FileText size={18} className="text-blue-400" />
                      Input Content or News Link
                    </h2>
                    <span className="text-xs font-medium px-2.5 py-1 bg-emerald-500/15 text-emerald-400 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <Link2 size={12} /> Live URLs Supported
                    </span>
                  </div>

                  <div className="relative">
                    <textarea
                      rows={10}
                      className="w-full bg-slate-900/70 border border-slate-700/70 rounded-xl p-4 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none transition-all"
                      placeholder="Paste full news article text, headline snippet, or a live web URL (e.g., https://reuters.com/...)..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                    />
                    {text && (
                      <button
                        onClick={() => setText('')}
                        className="absolute top-3 right-3 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/80 px-2 py-1 rounded-md"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-slate-400 flex items-center gap-3">
                      <span>{text.length} characters</span>
                      <span>•</span>
                      <span>{text.trim().split(/\s+/).filter(Boolean).length} words</span>
                    </div>

                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || text.trim().length < 15}
                      className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Running AI Fact-Check...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Analyze Credibility
                        </>
                      )}
                    </button>
                  </div>

                  {error && (
                    <div className="mt-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-300 text-xs">
                      <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-400" />
                      <div>
                        <div className="font-semibold mb-0.5">Verification Error</div>
                        <div>{error}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Dynamic Analysis Results */}
              <div className="lg:col-span-5">
                {isAnalyzing ? (
                  <div className="glass-panel p-8 h-full flex flex-col items-center justify-center space-y-4 min-h-[420px]">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-30 rounded-full animate-pulse"></div>
                      <Loader2 size={54} className="text-blue-400 animate-spin relative z-10" />
                    </div>
                    <div className="text-center space-y-1">
                      <h3 className="text-sm font-semibold text-slate-200">Evaluating Linguistic Patterns</h3>
                      <p className="text-xs text-slate-400">Scrutinizing sensationalism, bias, and attribution...</p>
                    </div>
                  </div>
                ) : result ? (
                  <div className={`glass-panel p-6 h-full flex flex-col border-2 ${getVerdictStyle(result.verdict).border} ${getVerdictStyle(result.verdict).bgGlow}`}>
                    {/* Cached Notice Pill */}
                    {result.is_cached && (
                      <div className="mb-4 px-3 py-1.5 bg-indigo-500/15 border border-indigo-500/30 rounded-lg flex items-center justify-between text-xs text-indigo-300">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Zap size={14} className="text-indigo-400" />
                          Served from PostgreSQL Cache
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Queried {result.times_queried}×
                        </span>
                      </div>
                    )}

                    {/* Verdict Banner */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          AI Verification Verdict
                        </span>
                        <div className="flex items-center gap-3">
                          {getVerdictStyle(result.verdict).icon}
                          <span className={`text-3xl font-black tracking-tight ${getVerdictStyle(result.verdict).color}`}>
                            {result.verdict}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Confidence
                        </span>
                        <span className="text-2xl font-bold text-white">{result.confidence}%</span>
                      </div>
                    </div>

                    {/* Metric Gauges */}
                    <div className="grid grid-cols-2 gap-3 my-4">
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span className="flex items-center gap-1">
                            <Flame size={12} className="text-rose-400" /> Sensationalism
                          </span>
                          <span className="font-semibold text-slate-200">{result.sensationalism_score}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${result.sensationalism_score}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span className="flex items-center gap-1">
                            <Scale size={12} className="text-indigo-400" /> Editorial Bias
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-indigo-300 block truncate">
                          {result.bias_rating}
                        </span>
                      </div>
                    </div>

                    {/* Reasoning Section */}
                    <div className="space-y-3 flex-1">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Fact-Checker Rationale
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                        {result.reasoning}
                      </p>

                      {/* Red Flags List */}
                      {result.key_flags && result.key_flags.length > 0 && (
                        <div>
                          <span className="text-[11px] font-semibold text-rose-400 block mb-1.5 flex items-center gap-1">
                            <ShieldAlert size={12} /> Red Flags Detected ({result.key_flags.length}):
                          </span>
                          <ul className="space-y-1">
                            {result.key_flags.map((flag, idx) => (
                              <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                                <span className="text-rose-500 font-bold">•</span>
                                <span>{flag}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Credibility Indicators */}
                      {result.credibility_indicators && result.credibility_indicators.length > 0 && (
                        <div>
                          <span className="text-[11px] font-semibold text-emerald-400 block mb-1.5 flex items-center gap-1">
                            <ShieldCheck size={12} /> Credibility Factors ({result.credibility_indicators.length}):
                          </span>
                          <ul className="space-y-1">
                            {result.credibility_indicators.map((indicator, idx) => (
                              <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                                <span className="text-emerald-400 font-bold">•</span>
                                <span>{indicator}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Feedback & Actions Bar */}
                    <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Agree with AI?</span>
                        <button
                          onClick={() => handleFeedback('agree')}
                          disabled={feedbackSent}
                          className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                            feedbackSent
                              ? 'bg-slate-800 text-slate-500 border-slate-700'
                              : 'bg-slate-900 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border-slate-700'
                          }`}
                          title="Vote Agree"
                        >
                          <ThumbsUp size={13} />
                          <span>{result.upvotes || 0}</span>
                        </button>
                        <button
                          onClick={() => handleFeedback('disagree')}
                          disabled={feedbackSent}
                          className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                            feedbackSent
                              ? 'bg-slate-800 text-slate-500 border-slate-700'
                              : 'bg-slate-900 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border-slate-700'
                          }`}
                          title="Vote Disagree"
                        >
                          <ThumbsDown size={13} />
                          <span>{result.downvotes || 0}</span>
                        </button>
                      </div>

                      <button
                        onClick={handleCopyReport}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-200 flex items-center gap-1.5 transition-all"
                      >
                        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        {copied ? 'Copied!' : 'Copy Report'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="glass-panel p-8 h-full flex flex-col items-center justify-center space-y-4 text-center min-h-[420px] border-dashed border-slate-800">
                    <div className="p-4 bg-slate-900/60 rounded-2xl text-slate-600">
                      <ShieldCheck size={44} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-slate-300">Awaiting Input Content</h3>
                      <p className="text-xs text-slate-500 max-w-xs">
                        Enter news text or a live article link on the left, or select a preset scenario above to view the analysis.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DATABASE SCAN HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database size={20} className="text-blue-400" />
                  PostgreSQL Scan Registry
                </h2>
                <p className="text-xs text-slate-400">All analyzed articles persistently saved in PostgreSQL</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Filter Selector */}
                <select
                  value={filterVerdict}
                  onChange={(e) => setFilterVerdict(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none"
                >
                  <option value="all">All Verdicts</option>
                  <option value="real">Real Only</option>
                  <option value="fake">Fake Only</option>
                  <option value="satire">Satire Only</option>
                  <option value="unverified">Unverified Only</option>
                </select>

                <button
                  onClick={fetchHistory}
                  disabled={isLoadingHistory}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all"
                  title="Refresh from PostgreSQL"
                >
                  <RefreshCw size={14} className={isLoadingHistory ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {isLoadingHistory ? (
              <div className="p-12 text-center text-slate-400 glass-panel">
                <Loader2 size={32} className="animate-spin mx-auto mb-2 text-blue-400" />
                <span className="text-xs">Querying PostgreSQL database...</span>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-500 glass-panel">
                <History size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No analysis records match your filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setResult(item);
                      setActiveTab('detector');
                    }}
                    className="glass-card p-5 cursor-pointer relative group rounded-xl"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getVerdictStyle(item.verdict).badgeClass}`}>
                        {item.verdict} • {item.confidence}%
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        <button
                          onClick={(e) => handleDeleteHistory(item.id, e)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                          title="Delete from PostgreSQL"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-100 line-clamp-1 mb-1 group-hover:text-blue-400 transition-colors">
                      {item.title || 'Untitled Article'}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {item.reasoning}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                      <span className="flex items-center gap-1">
                        <Zap size={11} className="text-indigo-400" />
                        Scanned {item.times_queried}×
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-emerald-400">+{item.upvotes || 0}</span>
                        <span className="text-rose-400">-{item.downvotes || 0}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PLATFORM ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 size={20} className="text-blue-400" />
                    Global Fact-Checking Metrics
                  </h2>
                  <p className="text-xs text-slate-400">Live PostgreSQL aggregated intelligence</p>
                </div>
                <button
                  onClick={fetchStats}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              {stats ? (
                <div className="space-y-8">
                  {/* Key Performance Indicators */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1">Total Scans Recorded</span>
                      <span className="text-3xl font-extrabold text-white">{stats.total_scans}</span>
                    </div>
                    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1">Debunked Fake Stories</span>
                      <span className="text-3xl font-extrabold text-rose-400">{stats.fake_count}</span>
                    </div>
                    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1">Verified Real Articles</span>
                      <span className="text-3xl font-extrabold text-emerald-400">{stats.real_count}</span>
                    </div>
                    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400 block mb-1">Database Cache Saves</span>
                      <span className="text-3xl font-extrabold text-indigo-400">{stats.cached_queries_served}</span>
                    </div>
                  </div>

                  {/* Distribution Bar */}
                  {stats.total_scans > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span>Classification Distribution</span>
                        <span>Avg Confidence: {stats.avg_confidence}%</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
                        <div
                          style={{ width: `${(stats.real_count / stats.total_scans) * 100}%` }}
                          className="bg-emerald-500 h-full"
                          title={`Real: ${stats.real_count}`}
                        ></div>
                        <div
                          style={{ width: `${(stats.fake_count / stats.total_scans) * 100}%` }}
                          className="bg-rose-500 h-full"
                          title={`Fake: ${stats.fake_count}`}
                        ></div>
                        <div
                          style={{ width: `${(stats.satire_count / stats.total_scans) * 100}%` }}
                          className="bg-amber-500 h-full"
                          title={`Satire: ${stats.satire_count}`}
                        ></div>
                        <div
                          style={{ width: `${(stats.unverified_count / stats.total_scans) * 100}%` }}
                          className="bg-slate-500 h-full"
                          title={`Unverified: ${stats.unverified_count}`}
                        ></div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Real ({stats.real_count})
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Fake ({stats.fake_count})
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Satire ({stats.satire_count})
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span> Unverified ({stats.unverified_count})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <Loader2 size={24} className="animate-spin mx-auto mb-2 text-blue-400" />
                  <span className="text-xs">Loading analytics...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t border-slate-800/60 text-center text-xs text-slate-500 space-y-2">
          <p>TruthLens AI • Complete Fact-Checking Platform powered by FastAPI, PostgreSQL (Port 5433) & Google Gemini AI</p>
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-600">
            <span>FastAPI 0.111</span>
            <span>•</span>
            <span>PostgreSQL 127.0.0.1:5433</span>
            <span>•</span>
            <span>React 19 + TailwindCSS</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
