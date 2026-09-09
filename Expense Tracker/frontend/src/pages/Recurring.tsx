import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Repeat, Play, Trash2, Edit2, X, Calendar, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Recurring() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form states
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const { data: recurringRules, isLoading } = useQuery({
    queryKey: ['recurring'],
    queryFn: async () => {
      const res = await api.get('/recurring');
      return res.data;
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (newRule: any) => api.post('/recurring', newRule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      closeModal();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Failed to create rule');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/recurring/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      closeModal();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Failed to update rule');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/recurring/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
    }
  });

  const processMutation = useMutation({
    mutationFn: () => api.post('/recurring/process'),
    onSuccess: (res) => {
      setStatusMessage(res.data.message || 'Processed recurring expenses');
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setTimeout(() => setStatusMessage(null), 4000);
    }
  });

  const openCreateModal = () => {
    setEditingRule(null);
    setMerchant('');
    setAmount('');
    setCategoryId(categories?.[0]?.id || categories?.[0]?._id || '');
    setFrequency('monthly');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setEndDate('');
    setPaymentMethod('UPI');
    setDescription('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (rule: any) => {
    setEditingRule(rule);
    setMerchant(rule.merchant);
    setAmount(String(rule.amount));
    setCategoryId(rule.category_id || rule.categoryId?.id || '');
    setFrequency(rule.frequency);
    setStartDate(rule.startDate ? format(new Date(rule.startDate), 'yyyy-MM-dd') : '');
    setEndDate(rule.endDate ? format(new Date(rule.endDate), 'yyyy-MM-dd') : '');
    setPaymentMethod(rule.paymentMethod || 'UPI');
    setDescription(rule.description || '');
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant.trim() || !amount) return;

    const payload = {
      merchant: merchant.trim(),
      amount: parseFloat(amount),
      categoryId: categoryId || null,
      frequency,
      startDate,
      endDate: endDate || null,
      paymentMethod,
      description: description.trim() || null
    };

    if (editingRule) {
      updateMutation.mutate({
        id: editingRule.id || editingRule._id,
        data: payload
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isLoading) return <div className="p-8">Loading recurring expenses...</div>;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recurring Expenses</h1>
          <p className="text-muted-foreground">Automate subscriptions and repeating bills.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => processMutation.mutate()}
            disabled={processMutation.isPending}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4 text-primary" />
            <span>{processMutation.isPending ? 'Processing...' : 'Run Due Now'}</span>
          </Button>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>New Rule</span>
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Rules Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(recurringRules || []).map((rule: any) => (
          <Card key={rule.id || rule._id} className="relative overflow-hidden border shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {rule.frequency}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(rule)}
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete recurring rule for "${rule.merchant}"?`)) {
                        deleteMutation.mutate(rule.id || rule._id);
                      }
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <CardTitle className="text-lg mt-2">{rule.merchant}</CardTitle>
              <CardDescription>
                {rule.categoryId?.name || 'Uncategorized'} • {rule.paymentMethod}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{Number(rule.amount).toFixed(2)}</div>
              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Next: {rule.nextOccurrence ? format(new Date(rule.nextOccurrence), 'PP') : 'N/A'}</span>
                </div>
                <span className={`font-semibold ${rule.isActive ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {rule.isActive ? 'Active' : 'Paused'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {recurringRules?.length === 0 && (
          <div className="col-span-full text-center py-16 bg-card rounded-xl border">
            <Repeat className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No recurring rules configured</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Add subscriptions, rent, or recurring bills to automatically generate expenses.
            </p>
            <Button onClick={openCreateModal} size="sm">Create First Rule</Button>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">
                {editingRule ? 'Edit Recurring Rule' : 'New Recurring Expense'}
              </h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Merchant / Payee
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix, Gym, Office Rent"
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
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e: any) => setFrequency(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    {(categories || []).map((cat: any) => (
                      <option key={cat.id || cat._id} value={cat.id || cat._id}>
                        {cat.name} ({cat.type})
                      </option>
                    ))}
                  </select>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Description / Note
                </label>
                <input
                  type="text"
                  placeholder="Optional description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  {editingRule ? 'Update Rule' : 'Save Rule'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
