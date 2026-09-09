'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  ArrowRightLeft,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Library,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/books', label: 'Catalog & Books', icon: BookOpen },
    { href: '/circulation', label: 'Circulation (Loans)', icon: ArrowRightLeft },
    { href: '/members', label: 'Members', icon: Users },
    { href: '/fines', label: 'Fines & Payments', icon: CreditCard },
    { href: '/reports', label: 'Reports & Audit', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-slate-950 h-full flex flex-col p-4 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="flex items-center space-x-3 mb-8 mt-2 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/30">
          <Library className="w-5 h-5" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-white block">LiberTech</span>
          <span className="text-[11px] text-slate-400 font-mono tracking-wider block">Enterprise Library</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Footer */}
      <div className="mt-auto pt-4 border-t border-slate-800/80 space-y-2">
        <Link
          href="/settings"
          className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
            pathname === '/settings'
              ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>System Settings</span>
        </Link>

        {user && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 mt-2 flex items-center justify-between">
            <div className="overflow-hidden mr-2">
              <span className="text-xs font-semibold text-white block truncate">{user.full_name}</span>
              <span className="text-[10px] text-indigo-400 uppercase font-mono tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
