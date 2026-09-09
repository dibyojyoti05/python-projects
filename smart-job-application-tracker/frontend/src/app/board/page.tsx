"use client";

import React, { useState, useEffect } from "react";
import {
  applicationsAPI,
  jobsAPI,
  interviewsAPI,
  followupsAPI,
  Application,
  Job,
  getErrorMessage,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Plus,
  Calendar,
  Clock,
  Trash2,
  X,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const COLUMNS = ["Saved", "Applied", "Interview", "Offer", "Rejected"];

const DEFAULT_DEMO_APPLICATIONS: Application[] = [
  {
    id: 101,
    user_id: 1,
    job_id: 1,
    status: "Saved",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    notes: "High priority backend opportunity",
    job: {
      id: 1,
      title: "Senior Backend Engineer",
      company: "Sanity",
      location: "Remote (Germany)",
      remote_type: "Remote",
      source_url: "https://sanity.io",
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 102,
    user_id: 1,
    job_id: 2,
    status: "Applied",
    applied_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    notes: "Applied via company portal",
    job: {
      id: 2,
      title: "Solutions Architect",
      company: "GitLab",
      location: "Remote",
      remote_type: "Remote",
      source_url: "https://gitlab.com",
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 103,
    user_id: 1,
    job_id: 3,
    status: "Interview",
    applied_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    notes: "Technical round scheduled for Friday",
    job: {
      id: 3,
      title: "AI Enablement Lead",
      company: "Actian",
      location: "Remote",
      remote_type: "Remote",
      source_url: "https://actian.com",
      created_at: new Date().toISOString(),
    },
  },
];

export default function KanbanBoard() {
  const { user, demoLogin } = useAuth();
  const [applications, setApplications] = useState<Application[]>(DEFAULT_DEMO_APPLICATIONS);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Add Application Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAppJobId, setNewAppJobId] = useState<string>("");
  const [newAppStatus, setNewAppStatus] = useState("Applied");
  const [newAppNotes, setNewAppNotes] = useState("");
  const [newAppContactPerson, setNewAppContactPerson] = useState("");
  const [newAppContactEmail, setNewAppContactEmail] = useState("");

  // Interview & Follow-up creation state in detail modal
  const [interviewRound, setInterviewRound] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [followupNote, setFollowupNote] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    Promise.all([
      applicationsAPI.getApplications(),
      jobsAPI.getJobs({ limit: 50 }),
    ])
      .then(([apps, availableJobs]) => {
        if (!isMounted) return;
        setApplications(apps);
        setJobs(availableJobs);
      })
      .catch((err) => {
        console.error("Error fetching applications", err);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);



  const handleMoveStatus = async (app: Application, direction: "prev" | "next") => {
    const currentIndex = COLUMNS.indexOf(app.status);
    const newIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (newIndex < 0 || newIndex >= COLUMNS.length) return;

    const newStatus = COLUMNS[newIndex];
    try {
      if (user) {
        await applicationsAPI.updateApplication(app.id, { status: newStatus });
      }
      setApplications((prev) =>
        prev.map((item) => (item.id === app.id ? { ...item, status: newStatus } : item))
      );
      showToast(`Moved to ${newStatus}`);
    } catch (err) {
      console.error("Failed to move status", err);
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppJobId) {
      showToast("Please select a job");
      return;
    }

    try {
      if (user) {
        const created = await applicationsAPI.createApplication({
          job_id: parseInt(newAppJobId),
          status: newAppStatus,
          notes: newAppNotes,
          contact_person: newAppContactPerson || undefined,
          contact_email: newAppContactEmail || undefined,
        });
        setApplications((prev) => [...prev, created]);
      } else {
        const foundJob = jobs.find((j) => j.id === parseInt(newAppJobId));
        const mockNew: Application = {
          id: Date.now(),
          user_id: 1,
          job_id: parseInt(newAppJobId),
          status: newAppStatus,
          notes: newAppNotes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          job: foundJob,
        };
        setApplications((prev) => [...prev, mockNew]);
      }
      setIsAddModalOpen(false);
      setNewAppJobId("");
      setNewAppNotes("");
      showToast("Application added to board!");
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "Could not add application"));
    }
  };

  const handleDeleteApplication = async (id: number) => {
    try {
      if (user) {
        await applicationsAPI.deleteApplication(id);
      }
      setApplications((prev) => prev.filter((item) => item.id !== id));
      setSelectedApp(null);
      showToast("Application deleted");
    } catch (err) {
      console.error("Failed to delete application", err);
    }
  };

  const handleAddInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !interviewRound || !interviewDate) return;
    try {
      if (user) {
        await interviewsAPI.createInterview({
          application_id: selectedApp.id,
          stage: interviewRound,
          interview_date: new Date(interviewDate).toISOString(),
        });
      }
      setInterviewRound("");
      setInterviewDate("");
      showToast("Interview round scheduled!");
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "Could not schedule interview"));
    }

  };

  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !followupDate) return;
    try {
      if (user) {
        await followupsAPI.createFollowup({
          application_id: selectedApp.id,
          due_date: new Date(followupDate).toISOString(),
          notes: followupNote || "Follow up on application",
        });
      }
      setFollowupNote("");
      setFollowupDate("");
      showToast("Follow-up reminder scheduled!");
    } catch (err: unknown) {
      showToast(getErrorMessage(err, "Could not add follow-up"));
    }
  };


  return (
    <div className="p-8 h-full flex flex-col space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-in fade-in flex items-center gap-2 border border-indigo-400/30">
          <Sparkles size={16} /> {toastMsg}
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Application Board</h1>
          <p className="text-gray-400 text-sm">
            Drag, transition, and monitor your progress across all hiring stages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!user && (
            <button
              onClick={() => demoLogin()}
              className="px-3 py-2 bg-[#222] hover:bg-[#2a2a2a] text-yellow-400 text-xs font-medium rounded-xl border border-yellow-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} /> Demo Mode
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg transition-colors cursor-pointer"
          >
            <Plus size={16} /> Add Application
          </button>
        </div>
      </header>

      {/* Kanban Board Container */}
      <div className="flex-1 flex gap-5 overflow-x-auto pb-4 pt-2">
        {COLUMNS.map((col) => {
          const colApps = applications.filter((app) => app.status === col);

          const colBadgeColors: Record<string, string> = {
            Saved: "bg-blue-500/10 text-blue-400 border-blue-500/20",
            Applied: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
            Interview: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
            Offer: "bg-green-500/10 text-green-400 border-green-500/20",
            Rejected: "bg-red-500/10 text-red-400 border-red-500/20",
          };

          return (
            <div
              key={col}
              className="w-80 flex-shrink-0 flex flex-col bg-[#111111] border border-[#222] rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Column Header */}
              <div className="p-4 border-b border-[#222] flex justify-between items-center bg-[#151515]">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-sm text-gray-200">{col}</h2>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono border ${
                      colBadgeColors[col] || "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {colApps.length}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setNewAppStatus(col);
                    setIsAddModalOpen(true);
                  }}
                  className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-[#222] transition-colors cursor-pointer"
                  title={`Add to ${col}`}
                >
                  <Plus size={15} />
                </button>
              </div>

              {/* Cards Container */}
              <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[400px]">
                {colApps.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center border border-dashed border-[#262626] rounded-xl text-gray-600 text-xs text-center p-4">
                    <span>No applications</span>
                    <button
                      onClick={() => {
                        setNewAppStatus(col);
                        setIsAddModalOpen(true);
                      }}
                      className="mt-2 text-indigo-400 hover:underline cursor-pointer"
                    >
                      + Add Card
                    </button>
                  </div>
                ) : (
                  colApps.map((app) => (
                    <div
                      key={app.id}
                      className="bg-[#181818] p-4 rounded-xl border border-[#2c2c2c] hover:border-[#444] transition-all shadow-sm group relative"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                          {app.job?.remote_type || "Remote"}
                        </span>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          {COLUMNS.indexOf(col) > 0 && (
                            <button
                              onClick={() => handleMoveStatus(app, "prev")}
                              className="p-1 rounded bg-[#242424] hover:bg-[#333] text-gray-400 hover:text-white transition-colors cursor-pointer"
                              title="Move Left"
                            >
                              <ChevronLeft size={13} />
                            </button>
                          )}
                          {COLUMNS.indexOf(col) < COLUMNS.length - 1 && (
                            <button
                              onClick={() => handleMoveStatus(app, "next")}
                              className="p-1 rounded bg-[#242424] hover:bg-[#333] text-gray-400 hover:text-white transition-colors cursor-pointer"
                              title="Move Right"
                            >
                              <ChevronRight size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div onClick={() => setSelectedApp(app)} className="cursor-pointer">
                        <h3 className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors">
                          {app.job?.title || "Software Opportunity"}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5 font-medium">
                          {app.job?.company || "Company"}
                        </p>

                        {app.notes && (
                          <p className="text-[11px] text-gray-400 mt-2.5 line-clamp-2 bg-[#141414] p-2 rounded-lg border border-[#242424]">
                            {app.notes}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-[#242424] flex items-center justify-between text-[11px] text-gray-500">
                        <span>
                          {app.applied_at
                            ? `Applied: ${new Date(app.applied_at).toLocaleDateString()}`
                            : `Updated: ${new Date(app.updated_at).toLocaleDateString()}`}
                        </span>
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="text-gray-400 hover:text-white cursor-pointer"
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Application Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#2a2a2a] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="font-bold text-lg text-white">Add Application to Tracker</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateApplication} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Select Job Listing
                </label>
                <select
                  required
                  value={newAppJobId}
                  onChange={(e) => setNewAppJobId(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose a scraped job --</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} • {j.company} ({j.location || "Remote"})
                    </option>
                  ))}
                </select>
                {jobs.length === 0 && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    No jobs currently in database. Visit{" "}
                    <Link href="/jobs" className="text-indigo-400 hover:underline">
                      Job Search
                    </Link>{" "}
                    to run the scraper!
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Initial Stage</label>
                <select
                  value={newAppStatus}
                  onChange={(e) => setNewAppStatus(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {COLUMNS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Application Notes / Details
                </label>
                <textarea
                  rows={3}
                  value={newAppNotes}
                  onChange={(e) => setNewAppNotes(e.target.value)}
                  placeholder="e.g. Applied via referral, resume v2 used, salary target $120k..."
                  className="w-full bg-[#181818] border border-[#333] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Contact Person (Optional)
                  </label>
                  <input
                    type="text"
                    value={newAppContactPerson}
                    onChange={(e) => setNewAppContactPerson(e.target.value)}
                    placeholder="Recruiter / Manager"
                    className="w-full bg-[#181818] border border-[#333] rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Contact Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={newAppContactEmail}
                    onChange={(e) => setNewAppContactEmail(e.target.value)}
                    placeholder="recruiter@co.com"
                    className="w-full bg-[#181818] border border-[#333] rounded-xl py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#222]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-[#222] hover:bg-[#2a2a2a] text-gray-300 text-sm rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl"
                >
                  Add to Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Detail Drawer / Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-[#222] flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Stage: {selectedApp.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {selectedApp.job?.remote_type || "Remote"}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-2">
                  {selectedApp.job?.title || "Application"}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {selectedApp.job?.company} • {selectedApp.job?.location || "Remote"}
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#222]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-sm text-gray-300">
              {/* Quick Status Bar */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Move Stage
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {COLUMNS.map((col) => (
                    <button
                      key={col}
                      onClick={async () => {
                        if (user) {
                          await applicationsAPI.updateApplication(selectedApp.id, { status: col });
                        }
                        setSelectedApp({ ...selectedApp, status: col });
                        setApplications((prev) =>
                          prev.map((a) => (a.id === selectedApp.id ? { ...a, status: col } : a))
                        );
                        showToast(`Status updated to ${col}`);
                      }}
                      className={`py-2 px-1 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                        selectedApp.status === col
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-md font-semibold"
                          : "bg-[#181818] text-gray-400 border-[#2a2a2a] hover:text-white hover:border-[#444]"
                      }`}
                    >
                      {col}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Application Notes
                </label>
                <div className="p-3 bg-[#181818] rounded-xl border border-[#2a2a2a] text-xs text-gray-300">
                  {selectedApp.notes || "No notes added yet."}
                </div>
              </div>

              {/* Schedule Interview */}
              <div className="p-4 bg-[#181818] rounded-2xl border border-[#2a2a2a] space-y-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-yellow-400" />
                  <h4 className="font-semibold text-xs text-white uppercase tracking-wider">
                    Schedule Interview Round
                  </h4>
                </div>
                <form onSubmit={handleAddInterview} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Round (e.g. System Design)"
                    value={interviewRound}
                    onChange={(e) => setInterviewRound(e.target.value)}
                    className="bg-[#121212] border border-[#333] rounded-xl py-2 px-3 text-xs text-white"
                  />
                  <input
                    type="datetime-local"
                    required
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="bg-[#121212] border border-[#333] rounded-xl py-2 px-3 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="py-2 px-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    + Log Interview
                  </button>
                </form>
              </div>

              {/* Schedule Follow-up */}
              <div className="p-4 bg-[#181818] rounded-2xl border border-[#2a2a2a] space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-400" />
                  <h4 className="font-semibold text-xs text-white uppercase tracking-wider">
                    Schedule Follow-up Check-in
                  </h4>
                </div>
                <form onSubmit={handleAddFollowup} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Note (e.g. Email recruiter)"
                    value={followupNote}
                    onChange={(e) => setFollowupNote(e.target.value)}
                    className="bg-[#121212] border border-[#333] rounded-xl py-2 px-3 text-xs text-white"
                  />
                  <input
                    type="date"
                    required
                    value={followupDate}
                    onChange={(e) => setFollowupDate(e.target.value)}
                    className="bg-[#121212] border border-[#333] rounded-xl py-2 px-3 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    + Set Reminder
                  </button>
                </form>
              </div>
            </div>

            <div className="p-4 border-t border-[#222] bg-[#151515] flex items-center justify-between">
              <button
                onClick={() => handleDeleteApplication(selectedApp.id)}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              >
                <Trash2 size={15} /> Delete Application
              </button>

              {selectedApp.job?.source_url && (
                <a
                  href={selectedApp.job.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
                >
                  Original Listing <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
