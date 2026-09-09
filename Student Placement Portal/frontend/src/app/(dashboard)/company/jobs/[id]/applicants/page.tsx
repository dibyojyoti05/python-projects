"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchApi, getResumeUrl } from "@/lib/api";
import Link from "next/link";
import {
  ArrowLeft, User, Mail, GraduationCap, FileText, CheckCircle2,
  Clock, XCircle, Award, Phone, Calendar, Video, ExternalLink, X, Code2, Briefcase
} from "lucide-react";

interface Application {
  id: number;
  job_id: number;
  student_id: number;
  status: string;
  applied_at: string;
  notes?: string;
  interview_date?: string;
  interview_link?: string;
  interview_round?: string;
  student_name?: string;
  student_email?: string;
  college?: string;
  department?: string;
  cgpa?: number;
  phone?: string;
  resume_id?: number;
  resume_url?: string;
}

interface StudentFullProfile {
  id: number;
  first_name?: string;
  last_name?: string;
  phone?: string;
  college?: string;
  department?: string;
  cgpa?: number;
  backlogs?: number;
  skills: { id: number; name: string; proficiency: string }[];
  projects: { id: number; name: string; description: string; technologies: string; github_url?: string; live_url?: string }[];
  internships: { id: number; company: string; role: string; start_date: string; end_date?: string; description: string }[];
  educations: { id: number; institution: string; degree: string; field_of_study: string; grade: string }[];
}

interface Job {
  title: string;
  location?: string;
  job_type?: string;
}

export default function ApplicantsPage() {
  const { id } = useParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Profile Modal State
  const [inspectStudent, setInspectStudent] = useState<StudentFullProfile | null>(null);

  // Interview Scheduling Modal State
  const [scheduleModalApp, setScheduleModalApp] = useState<Application | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    interview_date: "",
    interview_round: "Round 1 - Technical",
    interview_link: "",
    notes: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [appsData, jobData] = await Promise.all([
          fetchApi(`/applications/job/${id}`),
          fetchApi(`/jobs/${id}`),
        ]);
        setApplications(appsData);
        setJob(jobData);
      } catch (error) {
        console.error("Failed to load applicants", error);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadData();
  }, [id]);

  const handleStatusUpdate = async (appId: number, newStatus: string) => {
    if (newStatus === "Shortlisted") {
      const app = applications.find((a) => a.id === appId);
      if (app) {
        setScheduleModalApp(app);
        return;
      }
    }

    setUpdatingId(appId);
    try {
      const updated = await fetchApi(`/applications/${appId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setApplications((apps) =>
        apps.map((app) => (app.id === appId ? { ...app, ...updated } : app))
      );
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Failed to update application status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleModalApp) return;

    setUpdatingId(scheduleModalApp.id);
    try {
      const updated = await fetchApi(`/applications/${scheduleModalApp.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "Shortlisted",
          interview_date: scheduleForm.interview_date ? new Date(scheduleForm.interview_date).toISOString() : null,
          interview_round: scheduleForm.interview_round,
          interview_link: scheduleForm.interview_link,
          notes: scheduleForm.notes,
        }),
      });

      setApplications((apps) =>
        apps.map((app) => (app.id === scheduleModalApp.id ? { ...app, ...updated } : app))
      );
      setScheduleModalApp(null);
      alert("Candidate shortlisted & interview scheduled! Student notified.");
    } catch (err: any) {
      alert(err.message || "Failed to schedule interview");
    } finally {
      setUpdatingId(null);
    }
  };

  const openStudentModal = async (studentId: number) => {
    try {
      const data = await fetchApi(`/students/${studentId}`);
      setInspectStudent(data);
    } catch {
      alert("Failed to load student profile");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Pending</span>;
      case "reviewed":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><Clock className="w-3 h-3" /> Under Review</span>;
      case "shortlisted":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3" /> Shortlisted</span>;
      case "accepted":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800"><Award className="w-3 h-3" /> Offer Accepted</span>;
      case "rejected":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800"><XCircle className="w-3 h-3" /> Rejected</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Link href="/company/jobs" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800">
        <ArrowLeft className="w-4 h-4" /> Back to Company Jobs
      </Link>

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Applicants for {job?.title || "Role"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Total Candidates: <span className="font-semibold text-slate-800">{applications.length}</span>
          </p>
        </div>
      </div>

      {/* Applicants List */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No applicants yet</h3>
          <p className="text-sm text-slate-500 mt-1">Students will appear here once they submit their applications.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {applications.map((app) => {
            const resumeLink = app.resume_id
              ? getResumeUrl(app.resume_id)
              : app.resume_url
              ? `http://localhost:8000${app.resume_url}`
              : null;

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Candidate Details */}
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => openStudentModal(app.student_id)}
                      className="text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-2 text-left"
                    >
                      <User className="w-4 h-4 text-blue-600" />
                      {app.student_name || `Student #${app.student_id}`}
                      <span className="text-xs text-blue-600 underline font-normal ml-1">View Full Profile</span>
                    </button>
                    {getStatusBadge(app.status)}
                    {app.cgpa && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                        CGPA: {app.cgpa}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600">
                    {app.student_email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {app.student_email}
                      </div>
                    )}
                    {app.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {app.phone}
                      </div>
                    )}
                    {app.college && (
                      <div className="flex items-center gap-1.5 sm:col-span-2">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        {app.college} {app.department ? `• ${app.department}` : ""}
                      </div>
                    )}
                  </div>

                  {/* Interview Schedule Details if present */}
                  {app.interview_date && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        Interview Scheduled: {new Date(app.interview_date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                        <span className="text-emerald-700 font-normal">({app.interview_round || "Round"})</span>
                      </div>
                      {app.interview_link && (
                        <div className="flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Link:</span>
                          <a href={app.interview_link} target="_blank" rel="noreferrer" className="underline font-semibold text-emerald-800">
                            {app.interview_link}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {app.notes && (
                    <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-600">
                      <span className="font-semibold text-slate-700">Internal Evaluation Note:</span> {app.notes}
                    </div>
                  )}
                </div>

                {/* Status Selector & Resume Action */}
                <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-end">
                  {resumeLink ? (
                    <a
                      href={resumeLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20"
                    >
                      <FileText className="w-4 h-4" />
                      Download Resume
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No Resume Attached</span>
                  )}

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-600">Decision:</label>
                    <select
                      disabled={updatingId === app.id}
                      value={app.status}
                      onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                      className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Reviewed">Under Review</option>
                      <option value="Shortlisted">Shortlisted / Interview</option>
                      <option value="Accepted">Accepted Offer</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SCHEDULE INTERVIEW MODAL */}
      {scheduleModalApp && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Schedule Interview</h2>
                <p className="text-xs text-slate-500">Shortlisting {scheduleModalApp.student_name || "Student"}</p>
              </div>
              <button onClick={() => setScheduleModalApp(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInterview} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Interview Round</label>
                <input
                  type="text"
                  value={scheduleForm.interview_round}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, interview_round: e.target.value })}
                  placeholder="e.g. Technical Round 1, System Design, HR"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduleForm.interview_date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, interview_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Meeting / Venue Link</label>
                <input
                  type="text"
                  value={scheduleForm.interview_link}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, interview_link: e.target.value })}
                  placeholder="e.g. https://meet.google.com/xyz-abcd-efg"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Internal Notes (Optional)</label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  rows={2}
                  placeholder="Candidate showed strong system design knowledge..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalApp(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingId !== null}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
                >
                  {updatingId ? "Saving..." : "Confirm & Send Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STUDENT FULL PROFILE INSPECTION MODAL */}
      {inspectStudent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {inspectStudent.first_name} {inspectStudent.last_name || ""}
                </h2>
                <p className="text-xs text-slate-500">
                  {inspectStudent.department} • {inspectStudent.college}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                    CGPA: {inspectStudent.cgpa ?? "N/A"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                    Backlogs: {inspectStudent.backlogs ?? 0}
                  </span>
                </div>
              </div>
              <button onClick={() => setInspectStudent(null)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-blue-600" /> Technical Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {inspectStudent.skills?.length > 0 ? (
                    inspectStudent.skills.map((s) => (
                      <span key={s.id} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800">
                        {s.name} <span className="text-[10px] text-blue-600">({s.proficiency})</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No skills listed</span>
                  )}
                </div>
              </div>

              {/* Projects */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-blue-600" /> Projects
                </h3>
                <div className="space-y-2">
                  {inspectStudent.projects?.length > 0 ? (
                    inspectStudent.projects.map((p) => (
                      <div key={p.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                        <span className="text-xs font-bold text-slate-900 block">{p.name}</span>
                        <p className="text-xs text-slate-600 mt-1">{p.description}</p>
                        {p.technologies && (
                          <span className="text-[10px] text-blue-700 mt-1 block font-medium">Stack: {p.technologies}</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No projects listed</span>
                  )}
                </div>
              </div>

              {/* Internships */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-blue-600" /> Work Experience
                </h3>
                <div className="space-y-2">
                  {inspectStudent.internships?.length > 0 ? (
                    inspectStudent.internships.map((i) => (
                      <div key={i.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-900">{i.role} at {i.company}</span>
                          <span className="text-[10px] text-slate-400">{i.start_date} to {i.end_date || "Present"}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{i.description}</p>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No prior experience listed</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInspectStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
