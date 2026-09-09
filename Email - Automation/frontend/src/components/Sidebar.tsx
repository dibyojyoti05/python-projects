"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Send, Workflow, MailPlus, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/useAuth";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Campaigns", href: "/dashboard/campaigns", icon: Send },
  { name: "Email Builder", href: "/dashboard/builder", icon: MailPlus },
  { name: "Contacts", href: "/dashboard/contacts", icon: Users },
  { name: "Workflows", href: "/dashboard/workflows", icon: Workflow },
  { name: "Visual Canvas", href: "/dashboard/workflows/builder", icon: Workflow },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || "US";

  return (
    <aside className="w-64 border-r bg-card/60 backdrop-blur-md flex flex-col h-full shrink-0">
      <div className="h-16 flex items-center justify-between px-6 border-b">
        <Link href="/dashboard" className="font-extrabold text-xl tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-sm shadow-md shadow-blue-500/20">
            ✉
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            MailFlow
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group relative",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn("mr-3 h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t bg-secondary/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 mr-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="ml-3 truncate">
              <p className="text-xs font-semibold text-foreground truncate">
                {user?.full_name || "Platform User"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {user?.email || "user@platform.com"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
