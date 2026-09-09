"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, FileText } from "lucide-react";

interface AdminMetrics {
  total_users?: number;
  total_jobs?: number;
  total_applications?: number;
}

interface Props {
  metrics: AdminMetrics;
}


export function AdminDashboardView({ metrics }: Props) {
  return (
    <div className="space-y-8">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Placement Officer Control Center</h1>
        <p className="text-sm text-slate-500 mt-1">Campus-wide placement analytics, hiring partner overview, and student records.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Registered Users</CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900">{metrics.total_users || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Students, Recruiters & Officers</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Placement Drives</CardTitle>
            <Briefcase className="w-5 h-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-indigo-600">{metrics.total_jobs || 0}</div>
            <Link href="/jobs" className="text-xs text-indigo-600 hover:underline mt-1 inline-block">
              Inspect drives &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Applications Handled</CardTitle>
            <FileText className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600">{metrics.total_applications || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Total student submissions</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
