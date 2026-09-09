import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import {
  IndianRupee,
  Activity,
  Plus,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => {
      const res = await api.get('/analytics/summary');
      return res.data;
    }
  });

  const { data: categoryBreakdown, isLoading: categoryLoading } = useQuery({
    queryKey: ['analytics', 'categories'],
    queryFn: async () => {
      const res = await api.get('/analytics/categories');
      return res.data;
    }
  });

  const { data: spendingTrends } = useQuery({
    queryKey: ['analytics', 'trends'],
    queryFn: async () => {
      const res = await api.get('/analytics/trends');
      return res.data;
    }
  });

  const { data: recentExpenses, isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', 'recent'],
    queryFn: async () => {
      const res = await api.get('/expenses?limit=6');
      return res.data?.data || [];
    }
  });

  if (summaryLoading || categoryLoading || expensesLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">Loading financial metrics...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

  const totalExpense = Number(summary?.totalExpenseThisMonth || 0);
  const totalIncome = Number(summary?.totalIncomeThisMonth || 0);
  const balance = Number(summary?.balance || 0);
  const txCount = summary?.expenseCountThisMonth || 0;
  const pctChange = summary?.percentageChange || 0;
  const budgetUtilization = summary?.budgetUtilization;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Overview</h1>
          <p className="text-muted-foreground">Monitor your cash flow, budget limits, and category trends.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/ai"
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border bg-card hover:bg-accent text-foreground transition-colors shadow-sm"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Scan with AI</span>
          </Link>
          <Link
            to="/expenses"
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Transaction</span>
          </Link>
        </div>
      </div>

      {/* Budget Warning Banner if threshold met */}
      {budgetUtilization && budgetUtilization.status === 'warning' && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                Monthly Budget Alert: {budgetUtilization.percentage}% Utilized
              </p>
              <p className="text-xs text-muted-foreground">
                You have spent ₹{Number(budgetUtilization.spent).toFixed(2)} of your ₹{Number(budgetUtilization.budgetAmount).toFixed(2)} monthly budget.
              </p>
            </div>
          </div>
          <Link
            to="/budgets"
            className="text-xs font-semibold px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shrink-0"
          >
            Manage Budget
          </Link>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Expense */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses (Month)</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalExpense.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className={`font-semibold ${pctChange > 0 ? 'text-red-500' : 'text-green-600'}`}>
                {pctChange > 0 ? `+${pctChange}%` : `${pctChange}%`}
              </span>
              <span>vs previous month</span>
            </p>
          </CardContent>
        </Card>

        {/* Total Income */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Income (Month)</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total revenue recorded</p>
          </CardContent>
        </Card>

        {/* Net Balance */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Savings / Balance</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <IndianRupee className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
              ₹{balance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Income minus expenses</p>
          </CardContent>
        </Card>

        {/* Activity / Transactions */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recorded Expenses</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-accent text-accent-foreground flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{txCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Daily Avg: ₹{Number(summary?.averageDaily || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Grid: Category Breakdown Pie Chart + Spending Trends Bar Chart */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Category Breakdown */}
        <Card className="lg:col-span-3 border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Expenses by Category</CardTitle>
            <CardDescription>Distribution of expenses for current month</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryBreakdown && categoryBreakdown.length > 0 ? (
              <div className="space-y-4">
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="total"
                        nameKey="name"
                      >
                        {categoryBreakdown.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color || COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Spent']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pt-2">
                  {categoryBreakdown.map((entry: any, index: number) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate font-medium">{entry.name}</span>
                      <span className="text-muted-foreground ml-auto">₹{Number(entry.total).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-center text-muted-foreground text-sm">
                No expense data recorded this month.
              </div>
            )}
          </CardContent>
        </Card>

        {/* 6-Month Spending Trends */}
        <Card className="lg:col-span-4 border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Spending Trends (6 Months)</CardTitle>
            <CardDescription>Monthly expense vs income comparison</CardDescription>
          </CardHeader>
          <CardContent>
            {spendingTrends && spendingTrends.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spendingTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="label" fontSize={12} tickLine={false} />
                    <YAxis fontSize={12} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip formatter={(val: any) => [`₹${Number(val).toFixed(2)}`]} />
                    <Bar dataKey="total" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-center text-muted-foreground text-sm">
                Trends will appear once transactions are recorded.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions List */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Your latest recorded transactions</CardDescription>
          </div>
          <Link to="/expenses" className="text-xs font-semibold text-primary hover:underline">
            View All →
          </Link>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {(recentExpenses || []).map((exp: any) => {
              const isExpense = exp.type === 'expense';
              return (
                <div key={exp.id || exp._id} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isExpense ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600'
                      }`}
                    >
                      {isExpense ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{exp.merchant}</p>
                      <p className="text-xs text-muted-foreground">
                        {exp.categoryId?.name || 'Uncategorized'} • {format(new Date(exp.date), 'PP')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${isExpense ? 'text-foreground' : 'text-green-600'}`}>
                      {isExpense ? '-' : '+'}₹{Number(exp.amount).toFixed(2)}
                    </p>
                    <span className="text-[10px] text-muted-foreground">{exp.paymentMethod}</span>
                  </div>
                </div>
              );
            })}

            {recentExpenses?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No recent activity. Click "Add Transaction" above to begin.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
