import { Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';

const expenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().optional().default('INR'),
  categoryId: z.string().nullable().optional(),
  merchant: z.string().min(1, 'Merchant is required'),
  description: z.string().optional().nullable(),
  date: z.string().or(z.date()),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  type: z.enum(['expense', 'income']).optional().default('expense'),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([])
});

const formatExpense = (row: any) => ({
  id: row.id,
  _id: row.id,
  userId: row.user_id,
  amount: Number(row.amount),
  currency: row.currency || 'INR',
  merchant: row.merchant,
  description: row.description || '',
  date: row.date,
  paymentMethod: row.payment_method,
  type: row.type || 'expense',
  notes: row.notes || '',
  tags: row.tags || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  categoryId: row.category_id ? {
    id: row.category_id,
    _id: row.category_id,
    name: row.category_name || 'Uncategorized',
    icon: row.category_icon || 'Tag',
    color: row.category_color || '#6B7280',
    type: row.category_type || 'expense'
  } : null
});

export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const conditions: string[] = ['e.user_id = $1'];
    const params: any[] = [userId];
    let paramIndex = 2;

    // Filter by Date
    if (req.query.startDate && req.query.endDate) {
      conditions.push(`e.date >= $${paramIndex} AND e.date <= $${paramIndex + 1}`);
      params.push(new Date(req.query.startDate as string), new Date(req.query.endDate as string));
      paramIndex += 2;
    }

    // Filter by Category
    if (req.query.categoryId) {
      conditions.push(`e.category_id = $${paramIndex}`);
      params.push(req.query.categoryId);
      paramIndex++;
    }

    // Filter by Payment Method
    if (req.query.paymentMethod) {
      conditions.push(`e.payment_method = $${paramIndex}`);
      params.push(req.query.paymentMethod);
      paramIndex++;
    }

    // Filter by Type
    if (req.query.type) {
      conditions.push(`e.type = $${paramIndex}`);
      params.push(req.query.type);
      paramIndex++;
    }

    // Search keyword
    if (req.query.search) {
      conditions.push(`(e.merchant ILIKE $${paramIndex} OR e.description ILIKE $${paramIndex} OR e.notes ILIKE $${paramIndex})`);
      params.push(`%${req.query.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Count total
    const countResult = await query(
      `SELECT COUNT(*) as total FROM expenses e WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Sorting
    const sortFieldMap: Record<string, string> = {
      date: 'e.date',
      amount: 'e.amount',
      merchant: 'e.merchant'
    };
    const sortField = sortFieldMap[req.query.sortBy as string] || 'e.date';
    const sortOrder = req.query.order === 'asc' ? 'ASC' : 'DESC';

    const listQuery = `
      SELECT 
        e.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        c.type as category_type
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, skip);

    const result = await query(listQuery, params);

    res.json({
      data: result.rows.map(formatExpense),
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error: any) {
    console.error('getExpenses error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

export const getExpenseById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const expenseId = req.params.id;

    const result = await query(
      `SELECT 
        e.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        c.type as category_type
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = $1 AND e.user_id = $2`,
      [expenseId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Expense not found' } });
      return;
    }

    res.json(formatExpense(result.rows[0]));
  } catch (error: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const validatedData = expenseSchema.parse(req.body);

    const result = await query(
      `INSERT INTO expenses (
        user_id, category_id, amount, currency, merchant, description, date, payment_method, type, notes, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        userId,
        validatedData.categoryId || null,
        validatedData.amount,
        validatedData.currency || 'INR',
        validatedData.merchant,
        validatedData.description || null,
        new Date(validatedData.date),
        validatedData.paymentMethod,
        validatedData.type || 'expense',
        validatedData.notes || null,
        validatedData.tags || []
      ]
    );

    // Fetch with category details
    const createdId = result.rows[0].id;
    const full = await query(
      `SELECT 
        e.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        c.type as category_type
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = $1`,
      [createdId]
    );

    res.status(201).json(formatExpense(full.rows[0]));
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } });
    } else {
      console.error('createExpense error:', error);
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }
};

export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const expenseId = req.params.id;
    const validatedData = expenseSchema.partial().parse(req.body);

    // Check existence
    const existing = await query('SELECT * FROM expenses WHERE id = $1 AND user_id = $2', [expenseId, userId]);
    if (existing.rows.length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Expense not found' } });
      return;
    }

    const cur = existing.rows[0];
    const amount = validatedData.amount !== undefined ? validatedData.amount : cur.amount;
    const currency = validatedData.currency !== undefined ? validatedData.currency : cur.currency;
    const categoryId = validatedData.categoryId !== undefined ? validatedData.categoryId : cur.category_id;
    const merchant = validatedData.merchant !== undefined ? validatedData.merchant : cur.merchant;
    const description = validatedData.description !== undefined ? validatedData.description : cur.description;
    const date = validatedData.date ? new Date(validatedData.date) : cur.date;
    const paymentMethod = validatedData.paymentMethod !== undefined ? validatedData.paymentMethod : cur.payment_method;
    const type = validatedData.type !== undefined ? validatedData.type : cur.type;
    const notes = validatedData.notes !== undefined ? validatedData.notes : cur.notes;
    const tags = validatedData.tags !== undefined ? validatedData.tags : cur.tags;

    await query(
      `UPDATE expenses
       SET category_id = $1, amount = $2, currency = $3, merchant = $4, description = $5,
           date = $6, payment_method = $7, type = $8, notes = $9, tags = $10, updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 AND user_id = $12`,
      [categoryId || null, amount, currency, merchant, description, date, paymentMethod, type, notes, tags, expenseId, userId]
    );

    const full = await query(
      `SELECT 
        e.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        c.type as category_type
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = $1`,
      [expenseId]
    );

    res.json(formatExpense(full.rows[0]));
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } });
    } else {
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const expenseId = req.params.id;

    const result = await query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id',
      [expenseId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Expense not found' } });
      return;
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};
