"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { GraduationCap, Briefcase, User as UserIcon, FileText, Building2, LogOut, LayoutDashboard, CheckCircle2, BarChart3, Users } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";

interface UserProfile {
  id: number;
  email: string;
  role: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const u = await fetchApi("/auth/me");
        setUser(u);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-600">Loading placement portal...</span>
        </div>
      </div>
    );
  }

  const isStudent = user?.role === "STUDENT";
  const isRecruiter = user?.role === "RECRUITER";
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "PLACEMENT_OFFICER";

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const navItemClass = (path: string) => {
    const active = pathname === path || (path !== "/dashboard" && pathname.startsWith(path));
    return `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
      active
        ? "bg-blue-50 text-blue-600 font-bold"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    }`;
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "STUDENT":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Student</span>;
      case "RECRUITER":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">Recruiter</span>;
      case "SUPER_ADMIN":
      case "PLACEMENT_OFFICER":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">Placement Officer</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          {/* Logo / Brand */}
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 leading-none block">PlaceMentor</span>
              <span className="text-[11px] text-slate-500 font-medium leading-tight block">Portal</span>
            </div>
          </Link>

          {/* Role-Specific Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link href="/dashboard" className={navItemClass("/dashboard")}>
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </Link>

            {isStudent && (
              <>
                <Link href="/profile" className={navItemClass("/profile")}>
                  <UserIcon className="w-4 h-4" /> My Profile
                </Link>
                <Link href="/jobs" className={navItemClass("/jobs")}>
                  <Briefcase className="w-4 h-4" /> Browse Jobs
                </Link>
                <Link href="/applications" className={navItemClass("/applications")}>
                  <FileText className="w-4 h-4" /> My Applications
                </Link>
              </>
            )}

            {isRecruiter && (
              <>
                <Link href="/company/jobs" className={navItemClass("/company/jobs")}>
                  <Building2 className="w-4 h-4" /> Company Jobs & Candidates
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link href="/jobs" className={navItemClass("/jobs")}>
                  <Briefcase className="w-4 h-4" /> All Drives
                </Link>
                <Link href="/admin/companies" className={navItemClass("/admin/companies")}>
                  <CheckCircle2 className="w-4 h-4" /> Company Approvals
                </Link>
                <Link href="/admin/reports" className={navItemClass("/admin/reports")}>
                  <BarChart3 className="w-4 h-4" /> Analytics & Reports
                </Link>
                <Link href="/admin/users" className={navItemClass("/admin/users")}>
                  <Users className="w-4 h-4" /> Users
                </Link>
              </>
            )}
          </nav>

          {/* User Profile, Notifications & Logout */}
          <div className="flex items-center space-x-3">
            <NotificationBell />

            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-slate-800">{user?.email}</span>
              <div className="mt-0.5">{getRoleBadge(user?.role)}</div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
