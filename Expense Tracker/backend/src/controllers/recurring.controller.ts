import { Response } from 'express';
import { z } from 'zod';
import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';

const recurringSchema = z.object({
  categoryId: z.string().nullable().optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().optional().default('INR'),
  merchant: z.string().min(1, 'Merchant is required'),
  description: z.string().optional().nullable(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  paymentMethod: z.string().min(1, 'Payment method is required')
});

const calculateNextOccurrence = (current: Date, frequency: string): Date => {
  switch (frequency) {
    case 'daily':
      return addDays(current, 1);
    case 'weekly':
      return addWeeks(current, 1);
    case 'monthly':
      return addMonths(current, 1);
    case 'yearly':
      return addYears(current, 1);
    default:
      return addMonths(current, 1);
  }
};

export const processDueRecurringExpenses = async (specificUserId?: string): Promise<number> => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const userCondition = specificUserId ? 'AND user_id = $2' : '';
  const params: any[] = [todayStr];
  if (specificUserId) params.push(specificUserId);

  const dueRules = await query(
    `SELECT * FROM recurring_expenses
     WHERE is_active = TRUE AND next_occurrence <= $1 ${userCondition}`,
    params
  );

  let generatedCount = 0;

  for (const rule of dueRules.rows) {
    // Generate expense
    await query(
      `INSERT INTO expenses (
        user_id, category_id, amount, currency, merchant, description, date, payment_method, type, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'expense', 'Generated from recurring rule')`,
      [
        rule.user_id,
        rule.category_id,
        rule.amount,
        rule.currency,
        rule.merchant,
        rule.description,
        new Date(rule.next_occurrence),
        rule.payment_method
      ]
    );

    generatedCount++;

    // Calculate next occurrence
    const currentOccur = new Date(rule.next_occurrence);
    const nextOccur = calculateNextOccurrence(currentOccur, rule.frequency);
    const nextOccurStr = format(nextOccur, 'yyyy-MM-dd');

    let stillActive = true;
    if (rule.end_date && nextOccur > new Date(rule.end_date)) {
      stillActive = false;
    }

    await query(
      `UPDATE recurring_expenses
       SET next_occurrence = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [nextOccurStr, stillActive, rule.id]
    );
  }

  return generatedCount;
};

export const getRecurringExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const result = await query(
      `SELECT 
        r.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color
      FROM recurring_expenses r
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json(result.rows.map((row) => ({
      ...row,
      _id: row.id,
      amount: Number(row.amount),
      isActive: row.is_active,
      startDate: row.start_date,
      endDate: row.end_date,
      nextOccurrence: row.next_occurrence,
      paymentMethod: row.payment_method,
      categoryId: row.category_id ? {
        id: row.category_id,
        _id: row.category_id,
        name: row.category_name,
        icon: row.category_icon,
        color: row.category_color
      } : null
    })));
  } catch (error: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

export const createRecurringExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const validatedData = recurringSchema.parse(req.body);

    const startDate = format(new Date(validatedData.startDate), 'yyyy-MM-dd');
    const endDate = validatedData.endDate ? format(new Date(validatedData.endDate), 'yyyy-MM-dd') : null;

    const result = await query(
      `INSERT INTO recurring_expenses (
        user_id, category_id, amount, currency, merchant, description, frequency,
        start_date, end_date, next_occurrence, payment_method, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        userId,
        validatedData.categoryId || null,
        validatedData.amount,
        validatedData.currency || 'INR',
        validatedData.merchant,
        validatedData.description || null,
        validatedData.frequency,
        startDate,
        endDate,
        startDate, // Initially same as start date
        validatedData.paymentMethod,
        validatedData.isActive !== undefined ? validatedData.isActive : true
      ]
    );

    const row = result.rows[0];
    res.status(201).json({
      ...row,
      _id: row.id,
      amount: Number(row.amount),
      isActive: row.is_active,
      nextOccurrence: row.next_occurrence
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } });
    } else {
      console.error('createRecurring error:', error);
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }
};

export const updateRecurringExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const recurringId = req.params.id;
    const validatedData = recurringSchema.partial().parse(req.body);

    const existing = await query('SELECT * FROM recurring_expenses WHERE id = $1 AND user_id = $2', [recurringId, userId]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurring expense not found' } });
      return;
    }

    const cur = existing.rows[0];
    const amount = validatedData.amount !== undefined ? validatedData.amount : cur.amount;
    const merchant = validatedData.merchant !== undefined ? validatedData.merchant : cur.merchant;
    const frequency = validatedData.frequency !== undefined ? validatedData.frequency : cur.frequency;
    const categoryId = validatedData.categoryId !== undefined ? validatedData.categoryId : cur.category_id;
    const paymentMethod = validatedData.paymentMethod !== undefined ? validatedData.paymentMethod : cur.payment_method;
    const description = validatedData.description !== undefined ? validatedData.description : cur.description;
    const isActive = validatedData.isActive !== undefined ? validatedData.isActive : cur.is_active;

    const result = await query(
      `UPDATE recurring_expenses
       SET amount = $1, merchant = $2, frequency = $3, category_id = $4,
           payment_method = $5, description = $6, is_active = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [amount, merchant, frequency, categoryId || null, paymentMethod, description, isActive, recurringId, userId]
    );

    const row = result.rows[0];
    res.json({
      ...row,
      _id: row.id,
      amount: Number(row.amount),
      isActive: row.is_active
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } });
    } else {
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }
};

export const deleteRecurringExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const recurringId = req.params.id;

    const result = await query(
      'DELETE FROM recurring_expenses WHERE id = $1 AND user_id = $2 RETURNING id',
      [recurringId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recurring expense not found' } });
      return;
    }

    res.json({ message: 'Recurring expense deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

export const triggerProcessRecurring = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const processed = await processDueRecurringExpenses(userId);
    res.json({ message: `Processed ${processed} due recurring expenses`, processedCount: processed });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};
