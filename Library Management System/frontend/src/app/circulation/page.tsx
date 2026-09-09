'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRightLeft,
  Plus,
  CheckCircle2,
  X,
  Loader2,
  Barcode
} from 'lucide-react';
import { api } from '@/lib/api';

export default function CirculationPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'overdue' | 'returned'>('active');


  // Modals
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueMemberId, setIssueMemberId] = useState<number | undefined>();
  const [issueCopyId, setIssueCopyId] = useState<number | undefined>();
  const [issueDays, setIssueDays] = useState(14);
  const [availableCopies, setAvailableCopies] = useState<any[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadLoans = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = filterTab === 'all' ? undefined : filterTab === 'overdue' ? undefined : filterTab;
      const isOverdueOnly = filterTab === 'overdue';
      const data = await api.getLoans(statusParam, isOverdueOnly);
      setLoans(data);
    } catch (err: any) {
      console.error('Error fetching loans', err);
    } finally {
      setLoading(false);
    }
  }, [filterTab]);

  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  const openIssueModal = async () => {
    setActionError(null);
    try {
      const [bList, mList] = await Promise.all([
        api.getBooks(),
        api.getMembers(undefined, 'active'),
      ]);
      setMembers(mList);

      // Collect available copies from books
      const copies: any[] = [];
      for (const b of bList) {
        if (b.available_copies > 0) {
          const detail = await api.getBook(b.id);
          const avCopies = detail.copies?.filter((c: any) => c.status === 'available') || [];
          avCopies.forEach((c: any) => {
            copies.push({ ...c, book_title: b.title });
          });
        }
      }
      setAvailableCopies(copies);
      if (copies.length > 0) setIssueCopyId(copies[0].id);
      if (mList.length > 0) setIssueMemberId(mList[0].id);

      setShowIssueModal(true);
    } catch (err: any) {
      alert(err.message || 'Error preparing issue modal');
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueCopyId || !issueMemberId) {
      setActionError('Please select a book copy and a member');
      return;
    }
    setActionError(null);
    try {
      await api.issueBook(Number(issueCopyId), Number(issueMemberId), Number(issueDays));
      setShowIssueModal(false);
      setActionSuccess('Book successfully issued to member!');
      loadLoans();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to issue book');
    }
  };

  const handleReturn = async (loanId: number, bookTitle: string) => {
    if (!confirm(`Process return for "${bookTitle}"?`)) return;
    try {
      const res = await api.returnBook(loanId);
      setActionSuccess(res.message);
      loadLoans();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to return book');
    }
  };

  const handleRenew = async (loanId: number) => {
    try {
      await api.renewLoan(loanId);
      setActionSuccess('Loan successfully renewed by 14 days!');
      loadLoans();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to renew loan');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Circulation Desk</h1>
          <p className="text-slate-400 text-sm mt-1">
            Check out titles, process returns, calculate overdue fines, and extend renewals.
          </p>
        </div>
        <button
          onClick={openIssueModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center space-x-2 shadow-lg shadow-indigo-900/30"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Book Loan</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        {(['active', 'overdue', 'returned', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition ${
              filterTab === tab
                ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            {tab === 'active' && 'Active Checkouts'}
            {tab === 'overdue' && 'Overdue Loans'}
            {tab === 'returned' && 'Returned History'}
            {tab === 'all' && 'All Records'}
          </button>
        ))}
      </div>

      {/* Loans Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-sm">Retrieving circulation loans...</span>
          </div>
        ) : loans.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            No loans match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/40 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="p-4 font-semibold">Book Title & Copy</th>
                  <th className="p-4 font-semibold">Member</th>
                  <th className="p-4 font-semibold">Issue Date</th>
                  <th className="p-4 font-semibold">Due Date</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Circulation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm text-slate-300">
                {loans.map((loan) => {
                  const isReturned = loan.status === 'returned';
                  const isOverdue = loan.is_overdue || loan.status === 'overdue';
                  return (
                    <tr key={loan.id} className="hover:bg-slate-900/50 transition">
                      <td className="p-4">
                        <div className="font-semibold text-slate-100">{loan.book_title}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <Barcode className="w-3 h-3 text-slate-500" />
                          <span>{loan.copy_barcode}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-slate-200">{loan.member_name}</div>
                        <div className="text-xs text-slate-500 font-mono">{loan.member_barcode}</div>
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        {new Date(loan.issued_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-xs">
                        <span className={isOverdue ? 'text-rose-400 font-semibold' : 'text-slate-300'}>
                          {new Date(loan.due_date).toLocaleDateString()}
                        </span>
                        {isOverdue && (
                          <div className="text-[10px] text-rose-400 font-medium mt-0.5">
                            {loan.days_overdue} days late (${loan.fine_amount?.toFixed(2)} fine)
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isReturned
                              ? 'bg-slate-800 text-slate-400'
                              : isOverdue
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isReturned ? 'Returned' : isOverdue ? 'Overdue' : 'Active'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {!isReturned ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleRenew(loan.id)}
                              className="bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                              title="Renew for 14 days"
                            >
                              Renew ({loan.renewal_count || 0}/3)
                            </button>
                            <button
                              onClick={() => handleReturn(loan.id, loan.book_title)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm"
                            >
                              Process Return
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">
                            Returned {new Date(loan.returned_at).toLocaleDateString()}
                          </span>
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

      {/* Issue Book Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
                <span>Issue Book Copy</span>
              </h2>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
                {actionError}
              </div>
            )}

            <form onSubmit={handleIssue} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Active Member *
                </label>
                <select
                  required
                  value={issueMemberId || ''}
                  onChange={(e) => setIssueMemberId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.user?.full_name} ({m.member_barcode}) - Tier: {m.membership_type} (Limit: {m.borrowing_limit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Available Physical Copy *
                </label>
                {availableCopies.length === 0 ? (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-amber-400">
                    No physical copies are currently marked as available in the catalog.
                  </div>
                ) : (
                  <select
                    required
                    value={issueCopyId || ''}
                    onChange={(e) => setIssueCopyId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                  >
                    {availableCopies.map((c) => (
                      <option key={c.id} value={c.id}>
                        [{c.barcode}] {c.book_title} ({c.condition}, {c.shelf})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Loan Duration (Days)
                </label>
                <select
                  value={issueDays}
                  onChange={(e) => setIssueDays(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value={7}>7 Days (Short Loan)</option>
                  <option value={14}>14 Days (Standard Student Loan)</option>
                  <option value={30}>30 Days (Faculty / Research Loan)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={availableCopies.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-900/30"
                >
                  Confirm Checkout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
