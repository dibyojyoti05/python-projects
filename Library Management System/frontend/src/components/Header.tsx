'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/books?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-slate-950 border-b border-slate-800">
      {/* Quick Search */}
      <div className="flex-1">
        <form onSubmit={handleSearch} className="max-w-md relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search books by title, author, or ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 text-slate-200 placeholder-slate-500 transition"
          />
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        <div className="hidden sm:flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Port 5433 Connected</span>
        </div>

        {user ? (
          <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block">
              <span className="text-xs font-semibold text-slate-200 block leading-tight">{user.full_name}</span>
              <span className="text-[10px] text-slate-400 capitalize block">{user.role.toLowerCase()}</span>
            </div>
          </div>
        ) : (
          <a
            href="/login"
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-1.5 rounded-lg transition"
          >
            Sign In
          </a>
        )}
      </div>
    </header>
  );
}
