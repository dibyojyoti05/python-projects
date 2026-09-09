"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Clock, CheckCircle2, PlusCircle, Users } from "lucide-react";

interface RecruiterMetrics {
  recruiter_name?: string;
  total_jobs?: number;
  total_applicants?: number;
  pending_reviews?: number;
  shortlisted?: number;
}

interface CompanyJobItem {
  id: number;
  title: string;
  job_type?: string;
  location?: string;
  salary_range?: string;
}

interface Props {
  metrics: RecruiterMetrics;
  companyJobs: CompanyJobItem[];
}


export function RecruiterDashboardView({ metrics, companyJobs }: Props) {
  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Welcome, {metrics.recruiter_name || "Recruiter"}! 👋
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              Talent Partner
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage your company's campus placement drives, review candidates, and release offers.
          </p>
        </div>

        <Link
          href="/company/jobs"
          className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-2 transition-all w-fit"
        >
          <PlusCircle className="w-4 h-4" /> Manage & Post Jobs
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Openings</CardTitle>
            <Briefcase className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">{metrics.total_jobs || 0}</div>
            <Link href="/company/jobs" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
              View roles &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Applicants</CardTitle>
            <Users className="w-5 h-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-indigo-600">{metrics.total_applicants || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Total student submissions</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Review</CardTitle>
            <Clock className="w-5 h-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-amber-600">{metrics.pending_reviews || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Awaiting your evaluation</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Shortlisted</CardTitle>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600">{metrics.shortlisted || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Moved to interview stage</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Jobs & Candidate Pipelines */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Active Recruitment Drives</h2>
            <p className="text-xs text-slate-500 mt-0.5">Click "View Candidates" on any role to evaluate student resumes and update decision status.</p>
          </div>
          <Link href="/company/jobs" className="text-xs font-semibold text-blue-600 hover:underline">
            Manage All ({companyJobs.length}) &rarr;
          </Link>
        </div>

        {companyJobs.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            No active job drives posted yet. Create your first opening to receive student applications.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {companyJobs.map((job: any) => (
              <div key={job.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {job.job_type || "Full-time"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>📍 {job.location || "Remote"}</span>
                    <span>💰 {job.salary_range || "Competitive"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/company/jobs/${job.id}/applicants`}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-colors flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" /> View Applicants
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
