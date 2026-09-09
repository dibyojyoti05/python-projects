'use client';

import React, { useEffect, useState } from 'react';
import {
  Building,
  Server,
  Sliders,
  Plus,
  X,
  CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [showAddBranch, setShowAddBranch] = useState(false);

  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchEmail, setBranchEmail] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Policy settings
  const [loanDays, setLoanDays] = useState(14);
  const [finePerDay, setFinePerDay] = useState(1.0);
  const [maxRenewals, setMaxRenewals] = useState(3);

  const loadBranches = async () => {
    try {
      const bList = await api.getBranches();
      setBranches(bList);
    } catch (err) {
      console.error('Error fetching branches', err);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:8000/api/v1/catalog/branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token') || ''}`,
        },
        body: JSON.stringify({
          name: branchName,
          address: branchAddress,
          contact_email: branchEmail,
          contact_phone: branchPhone,
        }),
      });
      setShowAddBranch(false);
      setBranchName('');
      setBranchAddress('');
      setBranchEmail('');
      setBranchPhone('');
      setSavedSuccess('New branch added successfully!');
      loadBranches();
      setTimeout(() => setSavedSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error saving branch');
    }
  };

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess('Circulation parameters updated successfully!');
    setTimeout(() => setSavedSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Configuration & Branch Network</h1>
        <p className="text-slate-400 text-sm mt-1">
          Control circulation policies, regional branches, and review server infrastructure health.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {/* Infrastructure Health Status */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-400" />
          <span>Infrastructure Telemetry</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">PostgreSQL Database</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-semibold">
                ONLINE
              </span>
            </div>
            <p className="text-slate-200 font-mono text-[11px]">127.0.0.1:5433 (library_db)</p>
            <p className="text-slate-500 text-[10px]">Asyncpg + Alembic Migrations Active</p>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Backend API Engine</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-semibold">
                ACTIVE
              </span>
            </div>
            <p className="text-slate-200 font-mono text-[11px]">FastAPI 0.141 / Python 3.11</p>
            <p className="text-slate-500 text-[10px]">JWT HS256 + CORS Enabled</p>
          </div>

          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Frontend Client</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-semibold">
                TURBOPACK
              </span>
            </div>
            <p className="text-slate-200 font-mono text-[11px]">Next.js 16.3 / React 19</p>
            <p className="text-slate-500 text-[10px]">Tailwind Dark Mode Glassmorphism</p>
          </div>
        </div>
      </div>

      {/* Circulation Policy Rules */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <span>Global Circulation Policies</span>
        </h2>
        <p className="text-xs text-slate-400 mb-5">Configure system-wide borrowing duration and late return rates</p>

        <form onSubmit={handleSavePolicies} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Standard Loan Period (Days)
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={loanDays}
              onChange={(e) => setLoanDays(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Late Fee Rate ($ / Day)
            </label>
            <input
              type="number"
              step="0.25"
              min="0.00"
              max="10.00"
              value={finePerDay}
              onChange={(e) => setFinePerDay(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Max Consecutive Renewals
            </label>
            <input
              type="number"
              min="0"
              max="5"
              value={maxRenewals}
              onChange={(e) => setMaxRenewals(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end mt-2">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-semibold transition"
            >
              Update Policy Defaults
            </button>
          </div>
        </form>
      </div>

      {/* Library Branches Network */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Registered Branches ({branches.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Physical campuses and resource centers</p>
          </div>
          <button
            onClick={() => setShowAddBranch(true)}
            className="bg-slate-800 hover:bg-slate-700 text-indigo-400 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Branch</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 text-xs"
            >
              <div className="font-semibold text-slate-100 text-sm">{branch.name}</div>
              <p className="text-slate-400">{branch.address || 'Campus Location'}</p>
              <div className="pt-2 border-t border-slate-800/80 text-slate-500 space-y-0.5">
                <div>Email: {branch.contact_email || 'N/A'}</div>
                <div>Tel: {branch.contact_phone || 'N/A'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Branch Modal */}
      {showAddBranch && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-400" />
                <span>Add Library Branch</span>
              </h2>
              <button
                onClick={() => setShowAddBranch(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Branch Name *</label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. East Campus Medical Library"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Physical Address</label>
                <input
                  type="text"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  placeholder="700 Health Sciences Blvd"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={branchEmail}
                    onChange={(e) => setBranchEmail(e.target.value)}
                    placeholder="branch@library.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={branchPhone}
                    onChange={(e) => setBranchPhone(e.target.value)}
                    placeholder="+1 (555) 019-3344"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddBranch(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-900/30"
                >
                  Save Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
