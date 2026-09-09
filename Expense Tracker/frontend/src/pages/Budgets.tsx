import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, PieChart, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';

export default function Budgets() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);

  // Form states
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [alertThreshold, setAlertThreshold] = useState('80');
  const [error, setError] = useState('');

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const res = await api.get('/budgets');
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
    mutationFn: (newBudget: any) => api.post('/budgets', newBudget),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      closeModal();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Failed to create budget');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/budgets/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      closeModal();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error?.message || 'Failed to update budget');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/budgets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    }
  });

  const openCreateModal = () => {
    setEditingBudget(null);
    setCategoryId('');
    setAmount('');
    setPeriod('monthly');
    setAlertThreshold('80');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (b: any) => {
    setEditingBudget(b);
    setCategoryId(b.categoryId?.id || b.categoryId?._id || b.category_id || '');
    setAmount(String(b.amount));
    setPeriod(b.period || 'monthly');
    setAlertThreshold(String(b.alertThreshold || 80));
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    const payload = {
      categoryId: categoryId || null,
      amount: parseFloat(amount),
      period,
      alertThreshold: parseFloat(alertThreshold)
    };

    if (editingBudget) {
      updateMutation.mutate({
        id: editingBudget.id || editingBudget._id,
        data: payload
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isLoading) return <div className="p-8">Loading budgets...</div>;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">Monitor and control your category and monthly spending.</p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Create Budget</span>
        </Button>
      </div>

      {/* Budgets Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(budgets || []).map((budget: any) => {
          const budgetAmount = Number(budget.amount);
          const spent = Number(budget.spentAmount || 0);
          const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
          const threshold = Number(budget.alertThreshold || 80);

          let statusColor = 'bg-primary';
          let textColor = 'text-muted-foreground';
          let statusLabel = 'Healthy';

          if (percentage >= 100) {
            statusColor = 'bg-red-500';
            textColor = 'text-red-500';
            statusLabel = 'Exceeded Limit';
          } else if (percentage >= threshold) {
            statusColor = 'bg-amber-500';
            textColor = 'text-amber-500';
            statusLabel = 'Near Threshold';
          }

          const remaining = Math.max(0, budgetAmount - spent);

          return (
            <Card key={budget.id || budget._id} className="relative overflow-hidden border shadow-sm flex flex-col justify-between">
              <div className="h-1.5 w-full" style={{ backgroundColor: budget.categoryId?.color || '#3B82F6' }} />
              <div>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {budget.categoryId ? budget.categoryId.name : 'Overall Budget'}
                      </CardTitle>
                      <CardDescription className="capitalize">
                        {budget.period} Spending Cap
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(budget)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this budget?')) {
                            deleteMutation.mutate(budget.id || budget._id);
                          }
                        }}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">₹{budgetAmount.toFixed(2)}</span>
                    <span className={`text-xs font-semibold ${textColor}`}>
                      {percentage.toFixed(0)}% spent
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${statusColor}`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <span>Spent: ₹{spent.toFixed(2)}</span>
                    <span>Remaining: ₹{remaining.toFixed(2)}</span>
                  </div>
                </CardContent>
              </div>

              <div className="px-6 py-3 bg-muted/20 border-t flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Alert at {threshold}%</span>
                <span className={`font-semibold flex items-center gap-1 ${textColor}`}>
                  {percentage >= threshold && <AlertTriangle className="h-3.5 w-3.5" />}
                  {statusLabel}
                </span>
              </div>
            </Card>
          );
        })}

        {budgets?.length === 0 && (
          <div className="col-span-full text-center py-16 bg-card rounded-xl border">
            <PieChart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No budgets created yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Set monthly spending limits for individual categories or your entire account.
            </p>
            <Button onClick={openCreateModal} size="sm">Create First Budget</Button>
          </div>
        )}
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">
                {editingBudget ? 'Edit Budget' : 'Set New Budget'}
              </h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Scope / Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">Overall Monthly Budget (All Expenses)</option>
                  {(categories || [])
                    .filter((c: any) => c.type === 'expense')
                    .map((cat: any) => (
                      <option key={cat.id || cat._id} value={cat.id || cat._id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Limit Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Period
                  </label>
                  <select
                    value={period}
                    onChange={(e: any) => setPeriod(e.target.value)}
                    className="w-full p-2.5 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Warning Alert Threshold
                  </label>
                  <span className="text-xs font-bold text-primary">{alertThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="w-full accent-primary"
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
                  {editingBudget ? 'Save Changes' : 'Create Budget'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
