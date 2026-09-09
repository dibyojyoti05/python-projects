"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Clock, Award, UserCheck, AlertCircle, CheckCircle, Building2, MapPin } from "lucide-react";

interface StudentMetrics {
  student_name?: string;
  total_applications?: number;
  shortlisted?: number;
  accepted?: number;
  total_active_jobs?: number;
  profile_complete?: boolean;
}

interface ApplicationItem {
  id: number;
  job_id: number;
  status: string;
  job_title?: string;
  company_name?: string;
}

interface JobItem {
  id: number;
  title: string;
  company_name?: string;
  location?: string;
}

interface Props {
  metrics: StudentMetrics;
  recentApps: ApplicationItem[];
  featuredJobs: JobItem[];
}


export function StudentDashboardView({ metrics, recentApps, featuredJobs }: Props) {
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Pending</span>;
      case "reviewed":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Under Review</span>;
      case "shortlisted":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Shortlisted</span>;
      case "accepted":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Offer Accepted</span>;
      case "rejected":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">Not Selected</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Welcome back, {metrics.student_name || "Student"}! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your recruitment drives, upcoming interviews, and applications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/jobs"
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-2 transition-all"
          >
            <Briefcase className="w-4 h-4" /> Browse Jobs
          </Link>
          <Link
            href="/profile"
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            My Profile
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Applications</CardTitle>
            <Clock className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">{metrics.total_applications || 0}</div>
            <Link href="/applications" className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1">
              View all &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Shortlisted</CardTitle>
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600">{metrics.shortlisted || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Ready for interviews</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Offers Accepted</CardTitle>
            <Award className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-purple-600">{metrics.accepted || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Placement confirmed</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Drives</CardTitle>
            <Briefcase className="w-5 h-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-indigo-600">{metrics.total_active_jobs || 0}</div>
            <Link href="/jobs" className="text-xs text-indigo-600 hover:underline mt-1 inline-flex items-center gap-1">
              Explore drives &rarr;
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Profile Completeness Alert */}
      {!metrics.profile_complete ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <h3 className="text-base font-bold text-amber-900">Your profile requires completion</h3>
              <p className="text-sm text-amber-700">Add your college, department, CGPA, and resume to be eligible for company drives.</p>
            </div>
          </div>
          <Link
            href="/profile"
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shrink-0 shadow-sm"
          >
            Complete Profile
          </Link>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-sm text-emerald-800 font-medium">
            Your academic profile is verified and active for campus placements.
          </div>
        </div>
      )}

      {/* 2-Column Section: Recent Applications + Featured Drives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Applications */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Applications</h2>
            <Link href="/applications" className="text-xs font-semibold text-blue-600 hover:underline">
              View All &rarr;
            </Link>
          </div>

          {recentApps.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No applications submitted yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentApps.slice(0, 4).map((app: any) => (
                <div key={app.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{app.job_title || `Job #${app.job_id}`}</h4>
                    <p className="text-xs text-slate-500">{app.company_name || "Company Drive"}</p>
                  </div>
                  <div>{getStatusBadge(app.status)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Featured Drives */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Active Campus Drives</h2>
            <Link href="/jobs" className="text-xs font-semibold text-blue-600 hover:underline">
              Browse All ({featuredJobs.length}) &rarr;
            </Link>
          </div>

          {featuredJobs.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No active job drives currently posted.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {featuredJobs.slice(0, 4).map((job: any) => (
                <div key={job.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-900">{job.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {job.company_name && (
                        <span className="flex items-center gap-1 font-medium text-blue-600">
                          <Building2 className="w-3 h-3" /> {job.company_name}
                        </span>
                      )}
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {job.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg shrink-0"
                  >
                    Apply
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
