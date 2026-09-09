'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  DollarSign,
  X,
  Loader2,
  Bookmark,
  Receipt
} from 'lucide-react';
import { api } from '@/lib/api';


export default function FinesPage() {
  const [fines, setFines] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'fines' | 'payments' | 'reservations'>('fines');
  const [fineFilter, setFineFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Pay Modal
  const [selectedFine, setSelectedFine] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>('card');
  const [payError, setPayError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = fineFilter === 'all' ? undefined : fineFilter;
      const [fList, pList, rList] = await Promise.all([
        api.getFines(statusParam),
        api.getPayments(),
        api.getReservations(),
      ]);
      setFines(fList);
      setPayments(pList);
      setReservations(rList);
    } catch (err: any) {
      console.error('Error fetching financial records', err);
    } finally {
      setLoading(false);
    }
  }, [fineFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openPayModal = (fine: any) => {
    setSelectedFine(fine);
    setPayAmount(fine.amount - fine.paid_amount);
    setPayError(null);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError(null);
    try {
      await api.processPayment(selectedFine.id, Number(payAmount), payMethod);
      setSelectedFine(null);
      setSuccessMsg(`Payment of $${Number(payAmount).toFixed(2)} recorded successfully!`);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setPayError(err.message || 'Payment processing failed');
    }
  };

  const totalOutstanding = fines
    .filter((f) => f.status === 'unpaid' || f.status === 'partial')
    .reduce((acc, f) => acc + (f.amount - f.paid_amount), 0);

  const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Fines, Payments & Holds</h1>
          <p className="text-slate-400 text-sm mt-1">
            Track overdue penalty fees, process member settlements, and monitor reservation queues.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Unpaid Fines</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400">${totalOutstanding.toFixed(2)}</span>
            <span className="text-xs text-slate-500">outstanding balance</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Collected Revenue</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">${totalPaid.toFixed(2)}</span>
            <span className="text-xs text-slate-500">processed via ledger</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Book Holds Reserved</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-400">{reservations.length}</span>
            <span className="text-xs text-slate-500">active patron requests</span>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('fines')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'fines'
              ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Fines Directory ({fines.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'payments'
              ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Payment Ledger ({payments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
            activeTab === 'reservations'
              ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Holds & Reservations ({reservations.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'fines' && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            {(['all', 'unpaid', 'partial', 'paid'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFineFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                  fineFilter === st
                    ? 'bg-slate-800 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <span className="text-sm">Loading fines records...</span>
              </div>
            ) : fines.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No fine records match this filter. All clear!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/40 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                      <th className="p-4 font-semibold">Member & Card</th>
                      <th className="p-4 font-semibold">Associated Title / Reason</th>
                      <th className="p-4 font-semibold">Total Assessed</th>
                      <th className="p-4 font-semibold">Balance Remaining</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold text-right">Settlement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-sm text-slate-300">
                    {fines.map((fine) => {
                      const remaining = fine.amount - fine.paid_amount;
                      const isPaid = fine.status === 'paid';
                      return (
                        <tr key={fine.id} className="hover:bg-slate-900/50 transition">
                          <td className="p-4">
                            <div className="font-semibold text-slate-100">{fine.member_name}</div>
                            <div className="text-xs text-slate-500 font-mono">{fine.member_barcode}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-slate-200">{fine.book_title}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{fine.reason || 'Overdue loan'}</div>
                          </td>
                          <td className="p-4 text-xs font-semibold text-slate-300">
                            ${fine.amount?.toFixed(2)}
                          </td>
                          <td className="p-4 text-xs font-semibold">
                            {remaining > 0 ? (
                              <span className="text-rose-400">${remaining.toFixed(2)}</span>
                            ) : (
                              <span className="text-emerald-400">$0.00 (Settled)</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
                                isPaid
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : fine.status === 'partial'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {fine.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {!isPaid && (
                              <button
                                onClick={() => openPayModal(fine)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition shadow-sm"
                              >
                                Record Payment
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
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {payments.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-sm">
              No transactions recorded in payment history yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/40 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                    <th className="p-4 font-semibold">Transaction ID</th>
                    <th className="p-4 font-semibold">Member</th>
                    <th className="p-4 font-semibold">Amount Received</th>
                    <th className="p-4 font-semibold">Payment Method</th>
                    <th className="p-4 font-semibold">Date & Time</th>
                    <th className="p-4 font-semibold text-right">Processed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-sm text-slate-300">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/50 transition">
                      <td className="p-4 font-mono text-xs text-indigo-400">#TX-{p.id}</td>
                      <td className="p-4 font-medium text-slate-200">{p.member_name}</td>
                      <td className="p-4 text-xs font-bold text-emerald-400">${p.amount?.toFixed(2)}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-xs font-mono uppercase border border-slate-800">
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        {new Date(p.paid_at).toLocaleString()}
                      </td>
                      <td className="p-4 text-right text-xs text-slate-400 font-medium">
                        {p.processed_by_name || 'Staff Member'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reservations' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {reservations.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-sm">
              No book reservations currently in the hold queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/40 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                    <th className="p-4 font-semibold">Hold ID</th>
                    <th className="p-4 font-semibold">Book Title</th>
                    <th className="p-4 font-semibold">Requested By</th>
                    <th className="p-4 font-semibold">Date Placed</th>
                    <th className="p-4 font-semibold text-right">Hold Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-sm text-slate-300">
                  {reservations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-900/50 transition">
                      <td className="p-4 font-mono text-xs text-indigo-400">#RES-{r.id}</td>
                      <td className="p-4 font-semibold text-slate-200">{r.book_title}</td>
                      <td className="p-4 text-slate-300">{r.member_name}</td>
                      <td className="p-4 text-xs text-slate-400">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pay Fine Modal */}
      {selectedFine && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>Process Fine Payment</span>
              </h2>
              <button
                onClick={() => setSelectedFine(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {payError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
                {payError}
              </div>
            )}

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 mb-4 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Member:</span>
                <strong className="text-slate-200">{selectedFine.member_name}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Title:</span>
                <strong className="text-slate-200">{selectedFine.book_title}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Outstanding Balance:</span>
                <strong className="text-rose-400 font-bold">
                  ${(selectedFine.amount - selectedFine.paid_amount).toFixed(2)}
                </strong>
              </div>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.50"
                  min="0.50"
                  max={selectedFine.amount - selectedFine.paid_amount}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="card">Credit / Debit Card</option>
                  <option value="cash">Cash at Circulation Desk</option>
                  <option value="online">Online Student Account Debit</option>
                  <option value="cheque">Institutional Voucher</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedFine(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition shadow-lg shadow-emerald-900/30"
                >
                  Confirm Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
