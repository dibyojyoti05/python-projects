"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { LogOut, LayoutDashboard, Users, Camera, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <h1 className="text-xl font-bold tracking-tight text-white">FaceID Pro</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/dashboard" className="flex items-center px-4 py-3 text-sm text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Dashboard
          </Link>
          <Link href="/users" className="flex items-center px-4 py-3 text-sm text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
            <Users className="w-5 h-5 mr-3" />
            Personnel
          </Link>
          <Link href="/cameras" className="flex items-center px-4 py-3 text-sm text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
            <Camera className="w-5 h-5 mr-3" />
            Cameras
          </Link>
          <Link href="/logs" className="flex items-center px-4 py-3 text-sm text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
            <FileText className="w-5 h-5 mr-3" />
            Logs
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center px-8 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
          <h2 className="text-lg font-medium text-gray-200">Management Console</h2>
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
