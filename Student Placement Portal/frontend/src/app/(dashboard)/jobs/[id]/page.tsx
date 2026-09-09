"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import {
  ArrowLeft, Building2, MapPin, DollarSign, Calendar,
  CheckCircle2, XCircle, Briefcase, GraduationCap
} from "lucide-react";

interface Job {
  id: number;
  title: string;
  description: string;
  requirements: string;
  location: string;
  job_type: string;
  salary_range: string;
  company_id: number;
  company_name?: string;
  deadline?: string;
  min_cgpa?: number;
  max_backlogs?: number;
  eligible_branches?: string;
}

export default function JobDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    async function loadData() {
      try {
        const [jobData, profileData] = await Promise.all([
          fetchApi(`/jobs/${id}`),
          fetchApi("/students/me").catch(() => null), // If student
        ]);
        setJob(jobData);
        setStudentProfile(profileData);
      } catch (error) {
        console.error("Failed to load job details", error);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadData();
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    setMessage({ type: "", text: "" });
    try {
      await fetchApi("/applications", {
        method: "POST",
        body: JSON.stringify({ job_id: parseInt(id as string, 10) }),
      });
      setMessage({ type: "success", text: "Successfully applied! Your active resume was submitted." });
      setTimeout(() => {
        router.push("/applications");
      }, 1500);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Failed to apply." });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!job) {
    return <div className="p-8 text-center text-rose-500">Job drive not found.</div>;
  }

  const isExpired = job.deadline ? new Date(job.deadline) < new Date() : false;

  // Compute eligibility check if student profile loaded
  let isEligible = true;
  const eligibilityReasons: string[] = [];

  if (studentProfile) {
    if (job.min_cgpa && job.min_cgpa > 0) {
      const studentCgpa = studentProfile.cgpa || 0;
      if (studentCgpa < job.min_cgpa) {
        isEligible = false;
        eligibilityReasons.push(`Requires minimum ${job.min_cgpa} CGPA (Your CGPA: ${studentCgpa || "Not set"})`);
      }
    }

    if (job.max_backlogs !== undefined) {
      const studentBacklogs = studentProfile.backlogs || 0;
      if (studentBacklogs > job.max_backlogs) {
        isEligible = false;
        eligibilityReasons.push(`Allows maximum ${job.max_backlogs} backlogs (You have ${studentBacklogs})`);
      }
    }

    if (job.eligible_branches && job.eligible_branches.trim()) {
      const allowed = job.eligible_branches.split(",").map((b) => b.trim().toLowerCase());
      const studentDept = (studentProfile.department || "").trim().toLowerCase();
      if (!allowed.includes(studentDept)) {
        isEligible = false;
        eligibilityReasons.push(`Open to [${job.eligible_branches}] (Your branch: ${studentProfile.department || "Not specified"})`);
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800">
        <ArrowLeft className="w-4 h-4" /> Back to all jobs
      </Link>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {job.job_type || "Full-time"}
              </span>
              {job.company_name && (
                <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" /> {job.company_name}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{job.title}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-xs font-medium text-slate-500">
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.location}
                </span>
              )}
              {job.salary_range && (
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <DollarSign className="w-3.5 h-3.5" /> {job.salary_range}
                </span>
              )}
              {job.deadline && (
                <span className="flex items-center gap-1 text-amber-700 font-bold">
                  <Calendar className="w-3.5 h-3.5" /> Closes: {new Date(job.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div>
            {isExpired ? (
              <button disabled className="px-6 py-2.5 bg-slate-200 text-slate-500 font-bold rounded-xl text-xs cursor-not-allowed">
                Applications Closed
              </button>
            ) : (
              <button
                onClick={handleApply}
                disabled={applying || (studentProfile && !isEligible)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 transition-all"
              >
                {applying ? "Submitting Application..." : "Apply with Primary Resume"}
              </button>
            )}
          </div>
        </div>

        {/* Message Banner */}
        {message.text && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Eligibility Requirements Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-blue-600" /> Placement Eligibility Criteria
            </h3>
            {studentProfile && (
              isEligible ? (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> You are eligible to apply
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100/60 px-2.5 py-0.5 rounded-full">
                  <XCircle className="w-3.5 h-3.5" /> Ineligible for this drive
                </span>
              )
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px]">Minimum CGPA</span>
              <strong className="text-slate-800 text-sm">{job.min_cgpa ? `${job.min_cgpa} / 10.0` : "No Cutoff"}</strong>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px]">Max Active Backlogs</span>
              <strong className="text-slate-800 text-sm">{job.max_backlogs ?? "0 allowed"}</strong>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[11px]">Eligible Branches</span>
              <strong className="text-slate-800 text-sm truncate block" title={job.eligible_branches || "All branches"}>
                {job.eligible_branches || "Open to all disciplines"}
              </strong>
            </div>
          </div>

          {!isEligible && eligibilityReasons.length > 0 && (
            <div className="mt-2 text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 space-y-1">
              <span className="font-bold block">Why you cannot apply right now:</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {eligibilityReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Job Description */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-600" /> About The Role
          </h2>
          <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
            {job.description}
          </div>
        </div>

        {/* Requirements */}
        {job.requirements && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Key Skills & Requirements</h2>
            <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {job.requirements}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
