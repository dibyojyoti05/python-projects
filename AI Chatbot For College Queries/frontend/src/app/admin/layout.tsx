"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, Users, FileText, Settings, LogOut, Database, PieChart } from "lucide-react";
import styles from "./admin.module.css";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        router.push("/"); // Redirect non-admins to student portal
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center"><div className="spinner"></div></div>;
  }

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Documents", href: "/admin/documents", icon: FileText },
    { name: "College Info", href: "/admin/college", icon: Database },
    { name: "Unanswered", href: "/admin/analytics", icon: PieChart },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h1 className={`${styles.sidebarTitle} text-gradient`}>Admin Portal</h1>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className={`${styles.navItem} ${isActive ? styles.active : ""}`}>
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
          <button onClick={logout} className={`${styles.navItem} ${styles.danger}`}>
            <LogOut size={20} />
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className={styles.content}>
        <header className={styles.header}>
          <h2 className={styles.headerTitle}>
            {navItems.find(i => i.href === pathname)?.name || "Dashboard"}
          </h2>
          <div className={styles.userProfile}>
            <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center text-sm font-bold text-white" style={{background: 'var(--accent-gradient)'}}>
              {user.full_name.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-medium">{user.full_name}</div>
              <div className="text-xs text-secondary opacity-70">{user.role}</div>
            </div>
          </div>
        </header>
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
}
