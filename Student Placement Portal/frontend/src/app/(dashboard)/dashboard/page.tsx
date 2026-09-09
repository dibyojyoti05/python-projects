"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { StudentDashboardView } from "@/components/dashboard/StudentDashboardView";
import { RecruiterDashboardView } from "@/components/dashboard/RecruiterDashboardView";
import { AdminDashboardView } from "@/components/dashboard/AdminDashboardView";

interface DashboardMetrics {
  total_applications?: number;
  shortlisted?: number;
  accepted?: number;
  pending?: number;
  total_active_jobs?: number;
  profile_complete?: boolean;
  student_name?: string;
  total_jobs?: number;
  total_applicants?: number;
  pending_reviews?: number;
  recruiter_name?: string;
  company_setup_required?: boolean;
  total_users?: number;
}

interface DashboardStats {
  role: string;
  metrics: DashboardMetrics;
}

interface Application {
  id: number;
  job_id: number;
  status: string;
  applied_at?: string;
  job_title?: string;
  company_name?: string;
  job_location?: string;
  salary_range?: string;
}

interface Job {
  id: number;
  title: string;
  description?: string;
  location?: string;
  job_type?: string;
  salary_range?: string;
  company_id?: number;
  company_name?: string;
}

export default function DashboardPage() {
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [recentApps, setRecentApps] = useState<Application[]>([]);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [companyJobs, setCompanyJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const stats = await fetchApi("/dashboard/stats");
        setStatsData(stats);

        if (stats.role === "STUDENT") {
          const [apps, jobs] = await Promise.all([
            fetchApi("/applications/me").catch(() => []),
            fetchApi("/jobs").catch(() => [])
          ]);
          setRecentApps(apps || []);
          setFeaturedJobs(jobs || []);
        } else if (stats.role === "RECRUITER") {
          const cJobs = await fetchApi("/jobs/company/me").catch(() => []);
          setCompanyJobs(cJobs || []);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  const role = statsData?.role;
  const metrics = statsData?.metrics || {};

  if (role === "STUDENT") {
    return <StudentDashboardView metrics={metrics} recentApps={recentApps} featuredJobs={featuredJobs} />;
  }

  if (role === "RECRUITER") {
    return <RecruiterDashboardView metrics={metrics} companyJobs={companyJobs} />;
  }

  return <AdminDashboardView metrics={metrics} />;
}
