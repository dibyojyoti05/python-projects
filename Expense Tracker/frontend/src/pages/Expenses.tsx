import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Download,
  Edit2,
  Trash2,
  X,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard
} from 'lucide-react';

export default function Expenses() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 10;

  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  // Form Fields
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [notes, setNotes] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Fetch Categories for dropdowns
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    }
  });

  // Query params
  const buildQueryString = () => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search.trim()) params.set('search', search.trim());
    if (filterCategory) params.set('categoryId', filterCategory);
    if (filterType) params.set('type', filterType);
    if (filterPayment) params.set('paymentMethod', filterPayment);
    if (startDate && endDate) {
      params.set('startDate', startDate);
      params.set('endDate', endDate);
    }
    return params.toString();
  };

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page, search, filterCategory, filterType, filterPayment, startDate, endDate],
    queryFn: async () => {
      const res = await api.get(`/expenses?${buildQueryString()}`);
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (newExp: any) => api.post('/expenses', newExp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      closeModal();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Failed to save expense');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/expenses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      closeModal();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Failed to update expense');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    }
  });

  const openCreateModal = () => {
    setEditingExpense(null);
    setAmount('');
    setMerchant('');
    setCategoryId(categories?.[0]?.id || categories?.[0]?._id || '');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setPaymentMethod('UPI');
    setType('expense');
    setNotes('');
    setDescription('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (exp: any) => {
    setEditingExpense(exp);
    setAmount(String(exp.amount));
    setMerchant(exp.merchant);
    setCategoryId(exp.category_id || exp.categoryId?.id || exp.categoryId?._id || '');
    setDate(exp.date ? format(new Date(exp.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
    setPaymentMethod(exp.paymentMethod || 'UPI');
    setType(exp.type || 'expense');
    setNotes(exp.notes || '');
    setDescription(exp.description || '');
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant.trim() || !amount) return;

    const payload = {
      merchant: merchant.trim(),
      amount: parseFloat(amount),
      categoryId: categoryId || null,
      date,
      paymentMethod,
      type,
      notes: notes.trim() || null,
      description: description.trim() || null
    };

    if (editingExpense) {
      updateMutation.mutate({
        id: editingExpense.id || editingExpense._id,
        data: payload
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleExportCsv = async () => {
    try {
      const response = await api.get('/reports/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('CSV Export failed', err);
    }
  };

  const expenses = data?.data || [];
  const totalPages = data?.pagination?.pages || 1;
  const totalCount = data?.pagination?.total || 0;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">Manage and filter all your income and expenses.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportCsv} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Transaction</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search merchant or notes..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full py-2 px-3 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">All Categories</option>
                {(categories || []).map((cat: any) => (
                  <option key={cat.id || cat._id} value={cat.id || cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPage(1);
                }}
                className="w-full py-2 px-3 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">All Types</option>
                <option value="expense">Expense Only</option>
                <option value="income">Income Only</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <select
                value={filterPayment}
                onChange={(e) => {
                  setFilterPayment(e.target.value);
                  setPage(1);
                }}
                className="w-full py-2 px-3 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">All Payments</option>
                <option value="UPI">UPI</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            {/* Reset Filters */}
            <div>
              <button
                onClick={() => {
                  setSearch('');
                  setFilterCategory('');
                  setFilterType('');
                  setFilterPayment('');
                  setStartDate('');
                  setEndDate('');
                  setPage(1);
                }}
                className="w-full py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground border rounded-lg hover:bg-accent transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>History ({totalCount})</CardTitle>
            <span className="text-xs text-muted-foreground">Showing page {page} of {totalPages}</span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading transactions...</div>
          ) : (
            <div className="divide-y">
              {expenses.map((expense: any) => {
                const isExpense = expense.type === 'expense';
                return (
                  <div key={expense.id || expense._id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isExpense ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600'
                        }`}
                      >
                        {isExpense ? (
                          <ArrowDownRight className="h-5 w-5" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">{expense.merchant}</p>
                          <span
                            className="text-[11px] font-medium px-2 py-0.5 rounded-full border shrink-0"
                            style={{
                              borderColor: expense.categoryId?.color || '#6B7280',
                              color: expense.categoryId?.color || '#6B7280'
                            }}
                          >
                            {expense.categoryId?.name || 'Uncategorized'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(expense.date), 'PP')} • {expense.paymentMethod}
                          {expense.notes && ` • ${expense.notes}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className={`font-bold text-base ${isExpense ? 'text-foreground' : 'text-green-600'}`}>
                          {isExpense ? '-' : '+'}₹{Number(expense.amount).toFixed(2)}
                        </p>
                        <span className="text-[10px] text-muted-foreground uppercase">{expense.currency || 'INR'}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(expense)}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete transaction for "${expense.merchant}"?`)) {
                              deleteMutation.mutate(expense.id || expense._id);
                            }
                          }}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {expenses.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-semibold">No transactions found</p>
                  <p className="text-xs mt-1">Try adjusting your filters or record a new transaction.</p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">
                {editingExpense ? 'Edit Transaction' : 'Record Transaction'}
              </h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-2 text-sm font-medium rounded-lg border text-center transition-colors ${
                    type === 'expense'
                      ? 'bg-destructive/10 border-destructive text-destructive font-semibold'
                      : 'hover:bg-accent text-muted-foreground'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-2 text-sm font-medium rounded-lg border text-center transition-colors ${
                    type === 'income'
                      ? 'bg-green-500/10 border-green-500 text-green-600 font-semibold'
                      : 'hover:bg-accent text-muted-foreground'
                  }`}
                >
                  Income
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Merchant / Source
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swiggy, Amazon, Client Payment"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="">Uncategorized</option>
                    {(categories || [])
                      .filter((c: any) => c.type === type)
                      .map((cat: any) => (
                        <option key={cat.id || cat._id} value={cat.id || cat._id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Notes / Tags (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dinner with clients"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              {error && <p className="text-xs text-destructive font-medium">{error}</p>}

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingExpense ? 'Update Transaction' : 'Save Transaction'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
