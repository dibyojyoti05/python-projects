"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import { Briefcase, Building2, MapPin, DollarSign, Clock, CheckCircle2, Award, XCircle, ArrowRight } from "lucide-react";

interface Application {
  id: number;
  job_id: number;
  status: string;
  applied_at: string;
  notes?: string;
  job_title?: string;
  company_name?: string;
  job_location?: string;
  salary_range?: string;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const appsData = await fetchApi("/applications/me");
        setApplications(appsData || []);
      } catch (error) {
        console.error("Failed to load applications", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Application Received</span>;
      case "reviewed":
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"><Clock className="w-3 h-3" /> Under Review</span>;
      case "shortlisted":
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3" /> Shortlisted</span>;
      case "accepted":
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800"><Award className="w-3 h-3" /> Selected / Offer Accepted</span>;
      case "rejected":
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800"><XCircle className="w-3 h-3" /> Not Selected</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">{status}</span>;
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Job Applications</h1>
          <p className="text-sm text-slate-500 mt-1">Track the progress of your submitted placement applications in real time.</p>
        </div>
        <Link
          href="/jobs"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm flex items-center gap-2 transition-all w-fit"
        >
          <Briefcase className="w-4 h-4" /> Explore Open Roles
        </Link>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No applications submitted yet</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">Discover campus placement drives and apply to top companies.</p>
          <Link
            href="/jobs"
            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center gap-2"
          >
            Browse Active Jobs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-bold text-slate-900">
                    {app.job_title || `Job #${app.job_id}`}
                  </h3>
                  {getStatusBadge(app.status)}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                  {app.company_name && (
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" /> {app.company_name}
                    </span>
                  )}
                  {app.job_location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {app.job_location}
                    </span>
                  )}
                  {app.salary_range && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> {app.salary_range}
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400">
                  Applied on: {new Date(app.applied_at).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href={`/jobs/${app.job_id}`}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-sm transition-colors"
                >
                  View Job Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
