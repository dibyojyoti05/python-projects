"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Settings,
  LogIn,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, demoLogin } = useAuth();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/jobs", label: "Job Search", icon: Briefcase },
    { href: "/board", label: "Applications", icon: FileText },
  ];

  return (
    <aside className="w-64 bg-[#111111] border-r border-[#222] flex flex-col justify-between select-none">
      <div>
        <div className="h-16 flex items-center px-6 border-b border-[#222]">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              SJ
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-white">Smart Job Tracker</h1>
              <span className="text-[10px] text-indigo-400 font-medium">Auto-Discovery & Board</span>
            </div>
          </Link>
        </div>

        <nav className="p-4 space-y-1.5 text-sm font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-semibold"
                    : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
                }`}
              >
                <Icon size={18} className={isActive ? "text-indigo-400" : "text-gray-500"} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-[#222] space-y-3">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            pathname === "/settings"
              ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 font-semibold"
              : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
          }`}
        >
          <Settings size={18} /> Settings
        </Link>

        {user ? (
          <div className="pt-2 border-t border-[#1f1f1f] flex items-center justify-between">
            <div className="overflow-hidden pr-2">
              <p className="text-xs font-medium text-white truncate">{user.email}</p>
              <p className="text-[10px] text-green-400 font-mono">Logged In</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="pt-2 border-t border-[#1f1f1f] space-y-2">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-[#1c1c1c] hover:bg-[#252525] border border-[#333] text-gray-300 hover:text-white text-xs font-medium rounded-xl transition-colors"
            >
              <LogIn size={14} /> Sign In
            </Link>
            <button
              onClick={() => demoLogin()}
              className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[11px] font-medium rounded-xl border border-indigo-500/30 transition-colors cursor-pointer"
            >
              <Sparkles size={13} className="text-yellow-400" /> Demo Account
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
