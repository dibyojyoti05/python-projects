import { Response } from 'express';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, format } from 'date-fns';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';

export const getDashboardSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const now = new Date();

    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));

    // 1. Current month expenses
    const currExpRes = await query(
      `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count, COALESCE(MAX(amount), 0) as max_val
       FROM expenses
       WHERE user_id = $1 AND date >= $2 AND date <= $3 AND type = 'expense'`,
      [userId, monthStart, monthEnd]
    );
    const totalExpenseThisMonth = Number(currExpRes.rows[0].total);
    const expenseCountThisMonth = parseInt(currExpRes.rows[0].count, 10);
    const highestExpense = Number(currExpRes.rows[0].max_val);

    // 2. Current month income
    const currIncRes = await query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE user_id = $1 AND date >= $2 AND date <= $3 AND type = 'income'`,
      [userId, monthStart, monthEnd]
    );
    const totalIncomeThisMonth = Number(currIncRes.rows[0].total);

    // 3. Today's expense
    const todayRes = await query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE user_id = $1 AND date >= $2 AND date <= $3 AND type = 'expense'`,
      [userId, todayStart, todayEnd]
    );
    const todayTotal = Number(todayRes.rows[0].total);

    // 4. Previous month expense
    const prevExpRes = await query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE user_id = $1 AND date >= $2 AND date <= $3 AND type = 'expense'`,
      [userId, prevMonthStart, prevMonthEnd]
    );
    const prevMonthTotal = Number(prevExpRes.rows[0].total);

    // 5. Percent change
    let percentageChange = 0;
    if (prevMonthTotal > 0) {
      percentageChange = ((totalExpenseThisMonth - prevMonthTotal) / prevMonthTotal) * 100;
    } else if (totalExpenseThisMonth > 0) {
      percentageChange = 100;
    }

    const balance = totalIncomeThisMonth - totalExpenseThisMonth;
    const daysInMonth = now.getDate() || 1;
    const averageDaily = totalExpenseThisMonth / daysInMonth;

    // 6. Overall monthly budget utilization
    const budgetRes = await query(
      `SELECT * FROM budgets WHERE user_id = $1 AND category_id IS NULL AND period = 'monthly'`,
      [userId]
    );

    let budgetUtilization = null;
    if (budgetRes.rows.length > 0) {
      const b = budgetRes.rows[0];
      const budgetAmount = Number(b.amount);
      const percentage = budgetAmount > 0 ? (totalExpenseThisMonth / budgetAmount) * 100 : 0;
      budgetUtilization = {
        budgetAmount,
        spent: totalExpenseThisMonth,
        remaining: Math.max(0, budgetAmount - totalExpenseThisMonth),
        percentage: Math.min(100, Math.round(percentage)),
        status: percentage >= Number(b.alert_threshold) ? 'warning' : 'healthy'
      };
    }

    res.json({
      totalExpenseThisMonth,
      totalIncomeThisMonth,
      balance,
      expenseCountThisMonth,
      currentMonthTotal: totalExpenseThisMonth,
      totalIncome: totalIncomeThisMonth,
      transactionCount: expenseCountThisMonth,
      prevMonthTotal,
      percentageChange: Number(percentageChange.toFixed(1)),
      todayTotal,
      highestExpense,
      averageDaily: Number(averageDaily.toFixed(2)),
      savings: balance,
      budgetUtilization
    });
  } catch (error: any) {
    console.error('getDashboardSummary error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

export const getCategoryBreakdown = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const result = await query(
      `SELECT 
        COALESCE(c.name, 'Uncategorized') as name,
        COALESCE(c.color, '#6B7280') as color,
        COALESCE(c.icon, 'Tag') as icon,
        COALESCE(SUM(e.amount), 0) as total,
        COUNT(e.id) as count
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.user_id = $1 AND e.date >= $2 AND e.date <= $3 AND e.type = 'expense'
       GROUP BY c.name, c.color, c.icon
       ORDER BY total DESC`,
      [userId, monthStart, monthEnd]
    );

    const formatted = result.rows.map(r => ({
      name: r.name,
      color: r.color,
      icon: r.icon,
      total: Number(r.total),
      count: parseInt(r.count, 10)
    }));

    res.json(formatted);
  } catch (error: any) {
    console.error('getCategoryBreakdown error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

export const getSpendingTrends = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const now = new Date();
    const sixMonthsAgo = startOfMonth(subMonths(now, 5));

    const result = await query(
      `SELECT 
        TO_CHAR(date, 'Mon YYYY') as label,
        DATE_TRUNC('month', date) as month_date,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income
       FROM expenses
       WHERE user_id = $1 AND date >= $2
       GROUP BY month_date, label
       ORDER BY month_date ASC`,
      [userId, sixMonthsAgo]
    );

    res.json(result.rows.map(r => ({
      label: r.label,
      total: Number(r.total),
      income: Number(r.income)
    })));
  } catch (error: any) {
    console.error('getSpendingTrends error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};
