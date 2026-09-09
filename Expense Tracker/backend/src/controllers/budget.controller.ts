import { Response } from 'express';
import { z } from 'zod';
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';

const budgetSchema = z.object({
  categoryId: z.string().nullable().optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().optional().default('INR'),
  period: z.enum(['monthly', 'yearly']).optional().default('monthly'),
  month: z.number().min(1).max(12).optional(),
  year: z.number().optional(),
  alertThreshold: z.number().min(0).max(100).optional().default(80)
});

export const getBudgets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    const budgetsResult = await query(
      `SELECT 
        b.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC`,
      [userId]
    );

    const budgetsWithSpent = await Promise.all(
      budgetsResult.rows.map(async (b) => {
        const isYearly = b.period === 'yearly';
        const startDate = isYearly ? yearStart : monthStart;
        const endDate = isYearly ? yearEnd : monthEnd;

        let spentQuery: string;
        let spentParams: any[];

        if (b.category_id) {
          spentQuery = `
            SELECT COALESCE(SUM(amount), 0) as total_spent
            FROM expenses
            WHERE user_id = $1 AND category_id = $2 AND date >= $3 AND date <= $4 AND type = 'expense'
          `;
          spentParams = [userId, b.category_id, startDate, endDate];
        } else {
          spentQuery = `
            SELECT COALESCE(SUM(amount), 0) as total_spent
            FROM expenses
            WHERE user_id = $1 AND date >= $2 AND date <= $3 AND type = 'expense'
          `;
          spentParams = [userId, startDate, endDate];
        }

        const spentRes = await query(spentQuery, spentParams);
        const spentAmount = Number(spentRes.rows[0].total_spent);

        return {
          id: b.id,
          _id: b.id,
          userId: b.user_id,
          amount: Number(b.amount),
          currency: b.currency,
          period: b.period,
          month: b.month,
          year: b.year,
          alertThreshold: Number(b.alert_threshold),
          spentAmount,
          createdAt: b.created_at,
          updatedAt: b.updated_at,
          categoryId: b.category_id ? {
            id: b.category_id,
            _id: b.category_id,
            name: b.category_name,
            icon: b.category_icon,
            color: b.category_color
          } : null
        };
      })
    );

    res.json(budgetsWithSpent);
  } catch (error: any) {
    console.error('getBudgets error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

export const createBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const validatedData = budgetSchema.parse(req.body);

    const categoryId = validatedData.categoryId || null;
    const period = validatedData.period || 'monthly';

    // Duplicate check
    const duplicate = await query(
      `SELECT id FROM budgets 
       WHERE user_id = $1 AND COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid) = COALESCE($2, '00000000-0000-0000-0000-000000000000'::uuid) AND period = $3`,
      [userId, categoryId, period]
    );

    if (duplicate.rows.length > 0) {
      res.status(400).json({
        error: { code: 'DUPLICATE_BUDGET', message: 'A budget for this category and period already exists' }
      });
      return;
    }

    const result = await query(
      `INSERT INTO budgets (user_id, category_id, amount, currency, period, month, year, alert_threshold)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        categoryId,
        validatedData.amount,
        validatedData.currency || 'INR',
        period,
        validatedData.month || null,
        validatedData.year || null,
        validatedData.alertThreshold || 80
      ]
    );

    const b = result.rows[0];
    res.status(201).json({
      ...b,
      _id: b.id,
      amount: Number(b.amount),
      alertThreshold: Number(b.alert_threshold),
      spentAmount: 0
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } });
    } else {
      console.error('createBudget error:', error);
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }
};

export const updateBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const budgetId = req.params.id;
    const validatedData = budgetSchema.partial().parse(req.body);

    const existing = await query('SELECT * FROM budgets WHERE id = $1 AND user_id = $2', [budgetId, userId]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Budget not found' } });
      return;
    }

    const cur = existing.rows[0];
    const amount = validatedData.amount !== undefined ? validatedData.amount : cur.amount;
    const alertThreshold = validatedData.alertThreshold !== undefined ? validatedData.alertThreshold : cur.alert_threshold;
    const period = validatedData.period !== undefined ? validatedData.period : cur.period;
    const categoryId = validatedData.categoryId !== undefined ? validatedData.categoryId : cur.category_id;

    const result = await query(
      `UPDATE budgets
       SET amount = $1, alert_threshold = $2, period = $3, category_id = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [amount, alertThreshold, period, categoryId, budgetId, userId]
    );

    const b = result.rows[0];
    res.json({
      ...b,
      _id: b.id,
      amount: Number(b.amount),
      alertThreshold: Number(b.alert_threshold)
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } });
    } else {
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }
};

export const deleteBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const budgetId = req.params.id;

    const result = await query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING id',
      [budgetId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Budget not found' } });
      return;
    }

    res.json({ message: 'Budget deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};
