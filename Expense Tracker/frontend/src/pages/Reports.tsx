import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default function Reports() {
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(now), 'yyyy-MM-dd'));
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data;
    }
  });

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', startDate, endDate, categoryId, type],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (categoryId) params.set('categoryId', categoryId);
      if (type) params.set('type', type);
      const res = await api.get(`/reports/expenses?${params.toString()}`);
      return res.data;
    }
  });

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (categoryId) params.set('categoryId', categoryId);
      if (type) params.set('type', type);

      const response = await api.get(`/reports/export?${params.toString()}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial-report-${startDate}-to-${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export', error);
    } finally {
      setLoading(false);
    }
  };

  const transactions = reportData || [];
  const totalExpense = transactions
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const totalIncome = transactions
    .filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const netSavings = totalIncome - totalExpense;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Statements</h1>
          <p className="text-muted-foreground">Analyze your spending over custom periods and export statements.</p>
        </div>
        <Button onClick={handleExport} disabled={loading} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          <span>{loading ? 'Exporting...' : 'Export to CSV'}</span>
        </Button>
      </div>

      {/* Filter Parameters */}
      <Card className="border shadow-sm">
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">All Categories</option>
                {(categories || []).map((cat: any) => (
                  <option key={cat.id || cat._id} value={cat.id || cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Transaction Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2 text-sm rounded-lg border bg-background focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">All Types</option>
                <option value="expense">Expense Only</option>
                <option value="income">Income Only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI for Selected Period */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground font-medium">Period Total Expense</span>
            <div className="text-2xl font-bold mt-1 text-red-600">₹{totalExpense.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground font-medium">Period Total Income</span>
            <div className="text-2xl font-bold mt-1 text-green-600">₹{totalIncome.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground font-medium">Net Period Savings</span>
            <div className={`text-2xl font-bold mt-1 ${netSavings >= 0 ? 'text-foreground' : 'text-destructive'}`}>
              ₹{netSavings.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Data Table Preview */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Statement Preview ({transactions.length} Records)</CardTitle>
          <CardDescription>
            Filtered records for the period {startDate} to {endDate}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading report data...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Merchant</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((t: any) => (
                    <tr key={t.id || t._id} className="hover:bg-accent/40">
                      <td className="py-3 px-4 text-muted-foreground">{format(new Date(t.date), 'PP')}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                            t.type === 'expense'
                              ? 'bg-red-500/10 text-red-600'
                              : 'bg-green-500/10 text-green-600'
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{t.merchant}</td>
                      <td className="py-3 px-4 text-muted-foreground">{t.categoryId?.name || 'Uncategorized'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{t.paymentMethod}</td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {t.type === 'expense' ? '-' : '+'}₹{Number(t.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">
                        No transactions found for the selected date range and filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
