'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Barcode,
  Trash2,
  X,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';


export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Add Member Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Member@123');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [membershipType, setMembershipType] = useState('student');
  const [borrowingLimit, setBorrowingLimit] = useState(5);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMembers(searchQuery, statusFilter || undefined);
      setMembers(data);
    } catch (err: any) {
      console.error('Error fetching members', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadMembers();
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await api.quickRegisterMember({
        full_name: fullName,
        email,
        password,
        phone,
        address,
        membership_type: membershipType,
        borrowing_limit: Number(borrowingLimit),
      });
      setShowAddModal(false);
      setSuccessMsg(`Member ${fullName} registered successfully!`);
      // Reset
      setFullName('');
      setEmail('');
      setPhone('');
      setAddress('');
      loadMembers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create member');
    }
  };

  const handleDeactivate = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to deactivate member account for "${name}"?`)) return;
    try {
      await api.deleteMember(id);
      loadMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate member');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Member Roster & Circulation Profiles</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage patrons, student/faculty memberships, borrowing thresholds, and account standing.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center space-x-2 shadow-lg shadow-indigo-900/30"
        >
          <Plus className="w-4 h-4" />
          <span>Register Member</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearch} className="w-full md:max-w-md relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 text-slate-200 placeholder-slate-500"
          />
        </form>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-900 border border-slate-700 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
          <button
            onClick={loadMembers}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-sm font-medium transition"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-sm">Retrieving membership directory...</span>
          </div>
        ) : members.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            No members found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/40 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="p-4 font-semibold">Member Name & Contact</th>
                  <th className="p-4 font-semibold">Membership Tier</th>
                  <th className="p-4 font-semibold">Barcode Card</th>
                  <th className="p-4 font-semibold">Active Loans / Limit</th>
                  <th className="p-4 font-semibold">Fine Balance</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm text-slate-300">
                {members.map((m) => {
                  const isActive = m.status === 'active';
                  const hasFines = m.unpaid_fines_amount > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-900/50 transition">
                      <td className="p-4">
                        <div className="font-semibold text-slate-100">{m.user?.full_name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            {m.user?.email}
                          </span>
                          {m.phone && (
                            <span className="text-slate-500 flex items-center gap-1">
                              · <Phone className="w-3 h-3 text-slate-500" />
                              {m.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                          {m.membership_type}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-300">
                        <div className="flex items-center space-x-1.5">
                          <Barcode className="w-4 h-4 text-slate-500" />
                          <span>{m.member_barcode}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-medium">
                        <span className={m.active_loans_count >= m.borrowing_limit ? 'text-amber-400' : 'text-slate-300'}>
                          {m.active_loans_count} / {m.borrowing_limit} books
                        </span>
                      </td>
                      <td className="p-4 text-xs font-semibold">
                        {hasFines ? (
                          <span className="text-rose-400">${m.unpaid_fines_amount?.toFixed(2)}</span>
                        ) : (
                          <span className="text-emerald-400">$0.00 (Clear)</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {isActive && (
                          <button
                            onClick={() => handleDeactivate(m.id, m.user?.full_name)}
                            title="Suspend Member"
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>Register New Member Profile</span>
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Samuel Green"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="samuel@library.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Default Password *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Membership Tier</label>
                  <select
                    value={membershipType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMembershipType(val);
                      if (val === 'staff') setBorrowingLimit(10);
                      else if (val === 'student') setBorrowingLimit(5);
                      else setBorrowingLimit(3);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="student">Student (5 books limit)</option>
                    <option value="staff">Staff / Faculty (10 books limit)</option>
                    <option value="standard">Standard Community (3 books limit)</option>
                    <option value="premium">Premium (8 books limit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 012-3456"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Home / Campus Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Room 304, West Hall, Metro Campus"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-900/30"
                >
                  Register Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
