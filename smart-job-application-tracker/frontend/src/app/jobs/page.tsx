"use client";

import React, { useState, useEffect } from "react";
import { jobsAPI, applicationsAPI, scrapingAPI, Job, getErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  MapPin,
  Briefcase,
  ExternalLink,
  Bookmark,
  CheckCircle2,
  RefreshCw,
  X,
  Sparkles,
} from "lucide-react";

export default function JobSearchPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [remoteType, setRemoteType] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [savedJobIds, setSavedJobIds] = useState<Set<number>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<number>>(new Set());
  const [isScraping, setIsScraping] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    let isMounted = true;
    jobsAPI
      .getJobs({
        keyword: keyword || undefined,
        location: location || undefined,
        remote_type: remoteType || undefined,
        limit: 50,
      })
      .then((data) => {
        if (isMounted) setJobs(data);
      })
      .catch((err) => {
        console.error("Failed to load jobs", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [keyword, location, remoteType]);

  const handleSave = async (jobId: number) => {
    if (!user) {
      showToast("Please sign in to save jobs");
      return;
    }
    try {
      if (savedJobIds.has(jobId)) {
        await jobsAPI.unsaveJob(jobId);
        setSavedJobIds((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
        showToast("Job removed from saved");
      } else {
        await jobsAPI.saveJob(jobId);
        setSavedJobIds((prev) => new Set(prev).add(jobId));
        showToast("Job saved successfully!");
      }
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "Action failed"));
    }
  };

  const handleTrack = async (job: Job) => {
    if (!user) {
      showToast("Please sign in to track applications");
      return;
    }
    try {
      await applicationsAPI.createApplication({
        job_id: job.id,
        status: "Applied",
        notes: `Applied from Job Search: ${job.title} at ${job.company}`,
      });
      setAppliedJobIds((prev) => new Set(prev).add(job.id));
      showToast(`Added ${job.title} to your Application Board!`);
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "Could not track application"));
    }
  };

  const handleTriggerScraper = async () => {
    setIsScraping(true);
    showToast("Triggering live scrapers (RemoteOK & Arbeitnow)...");
    try {
      const res = await scrapingAPI.triggerScraping(keyword || "developer", location || "remote");
      showToast(`Scraper started: ${res.status}. Refreshing in 3s...`);
      setTimeout(() => {
        jobsAPI
          .getJobs({
            keyword: keyword || undefined,
            location: location || undefined,
            remote_type: remoteType || undefined,
            limit: 50,
          })
          .then(setJobs);
        setIsScraping(false);
      }, 3500);
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "Failed to start scraping"));
      setIsScraping(false);
    }
  };


  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-in fade-in flex items-center gap-2 border border-indigo-400/30">
          <Sparkles size={16} /> {toastMsg}
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Job Search & Discovery</h1>
          <p className="text-gray-400 text-sm">
            Live aggregated listings from RemoteOK, Arbeitnow, and developer boards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerScraper}
            disabled={isScraping}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={16} className={isScraping ? "animate-spin" : ""} />
            {isScraping ? "Scraping..." : "Scrape Latest Jobs"}
          </button>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="bg-[#111111] border border-[#222] p-4 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-3 shadow-sm">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search title, keywords, or company..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full bg-[#181818] border border-[#333] rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="relative">
          <MapPin className="absolute left-3.5 top-3 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Location..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-[#181818] border border-[#333] rounded-xl py-2.5 pl-11 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="relative">
          <select
            value={remoteType}
            onChange={(e) => setRemoteType(e.target.value)}
            className="w-full bg-[#181818] border border-[#333] rounded-xl py-2.5 px-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Work Types</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>
        </div>
      </div>

      {/* Job Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#111111] border border-[#222] rounded-2xl p-6 h-52 animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-[#111111] border border-[#222] rounded-2xl p-8 space-y-4">
          <Briefcase size={40} className="mx-auto text-gray-500" />
          <h3 className="text-lg font-semibold text-white">No jobs found</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Try adjusting your search criteria or click &quot;Scrape Latest Jobs&quot; to fetch fresh opportunities from our real scrapers.
          </p>
          <button
            onClick={handleTriggerScraper}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw size={16} /> Run Scraper Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => {
            const isSaved = savedJobIds.has(job.id);
            const isApplied = appliedJobIds.has(job.id);

            return (
              <div
                key={job.id}
                className="bg-[#111111] border border-[#222] hover:border-[#333] rounded-2xl p-6 flex flex-col justify-between transition-all hover:shadow-xl group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {job.remote_type || "Remote"}
                    </span>
                    <span className="text-[11px] text-gray-500 font-mono">
                      {job.posted_at ? new Date(job.posted_at).toLocaleDateString() : "Recent"}
                    </span>
                  </div>

                  <h3
                    onClick={() => setSelectedJob(job)}
                    className="font-semibold text-base text-white group-hover:text-indigo-400 transition-colors cursor-pointer line-clamp-2"
                  >
                    {job.title}
                  </h3>
                  <p className="text-sm text-gray-400 font-medium mt-1">{job.company}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-gray-500" /> {job.location || "Remote"}
                    </span>
                    {job.salary && (
                      <span className="text-green-400 font-medium bg-green-500/10 px-2 py-0.5 rounded">
                        {job.salary}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#1f1f1f] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleSave(job.id)}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                      isSaved
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                        : "border-[#2a2a2a] text-gray-400 hover:text-white hover:border-[#444]"
                    }`}
                    title={isSaved ? "Saved" : "Save Job"}
                  >
                    <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
                  </button>

                  <button
                    onClick={() => setSelectedJob(job)}
                    className="px-3 py-1.5 text-xs text-gray-300 hover:text-white bg-[#181818] hover:bg-[#222] border border-[#333] rounded-xl transition-colors cursor-pointer"
                  >
                    Details
                  </button>

                  <button
                    onClick={() => handleTrack(job)}
                    disabled={isApplied}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isApplied
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white"
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <CheckCircle2 size={13} /> Tracked
                      </>
                    ) : (
                      "Track in Board"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-[#222] flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {selectedJob.remote_type || "Remote"}
                </span>
                <h2 className="text-xl font-bold text-white mt-2">{selectedJob.title}</h2>
                <p className="text-sm text-gray-400 mt-0.5">{selectedJob.company} • {selectedJob.location || "Remote"}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#222]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-300">
              {selectedJob.salary && (
                <div className="p-3 rounded-xl bg-[#181818] border border-[#2a2a2a] flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Estimated Compensation</span>
                  <span className="text-sm font-semibold text-green-400">{selectedJob.salary}</span>
                </div>
              )}

              {selectedJob.requirements && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Requirements / Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.requirements.split(",").map((req, i) => (
                      <span key={i} className="text-xs bg-[#1f1f1f] text-gray-300 px-2.5 py-1 rounded-lg border border-[#333]">
                        {req.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Job Description</h4>
                <div
                  className="prose prose-invert max-w-none text-xs leading-relaxed text-gray-300 max-h-60 overflow-y-auto p-4 bg-[#181818] rounded-xl border border-[#2a2a2a]"
                  dangerouslySetInnerHTML={{ __html: selectedJob.description || "No description provided." }}
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#222] bg-[#151515] flex items-center justify-between gap-3">
              <a
                href={selectedJob.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-medium"
              >
                View Original Posting <ExternalLink size={13} />
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSave(selectedJob.id)}
                  className="px-4 py-2 text-xs font-medium text-gray-300 bg-[#222] hover:bg-[#2a2a2a] rounded-xl transition-colors cursor-pointer"
                >
                  {savedJobIds.has(selectedJob.id) ? "Saved" : "Save Job"}
                </button>
                <button
                  onClick={() => {
                    handleTrack(selectedJob);
                    setSelectedJob(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer"
                >
                  Track Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
