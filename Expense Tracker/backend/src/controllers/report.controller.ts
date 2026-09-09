import { Response } from 'express';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';

export const getExpenseReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate, categoryId, type } = { ...req.query, ...req.body };

    const conditions: string[] = ['e.user_id = $1'];
    const params: any[] = [userId];
    let paramIndex = 2;

    if (startDate && endDate) {
      conditions.push(`e.date >= $${paramIndex} AND e.date <= $${paramIndex + 1}`);
      params.push(new Date(startDate as string), new Date(endDate as string));
      paramIndex += 2;
    } else {
      const now = new Date();
      conditions.push(`e.date >= $${paramIndex} AND e.date <= $${paramIndex + 1}`);
      params.push(startOfMonth(now), endOfMonth(now));
      paramIndex += 2;
    }

    if (categoryId) {
      conditions.push(`e.category_id = $${paramIndex}`);
      params.push(categoryId);
      paramIndex++;
    }

    if (type) {
      conditions.push(`e.type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const result = await query(
      `SELECT 
        e.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE ${whereClause}
       ORDER BY e.date DESC`,
      params
    );

    res.json(result.rows.map(r => ({
      ...r,
      _id: r.id,
      amount: Number(r.amount),
      categoryId: r.category_id ? {
        id: r.category_id,
        _id: r.category_id,
        name: r.category_name,
        icon: r.category_icon,
        color: r.category_color
      } : null
    })));
  } catch (error: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

export const exportReportToCsv = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate, categoryId, type } = { ...req.query, ...req.body };

    const conditions: string[] = ['e.user_id = $1'];
    const params: any[] = [userId];
    let paramIndex = 2;

    if (startDate && endDate) {
      conditions.push(`e.date >= $${paramIndex} AND e.date <= $${paramIndex + 1}`);
      params.push(new Date(startDate as string), new Date(endDate as string));
      paramIndex += 2;
    }

    if (categoryId) {
      conditions.push(`e.category_id = $${paramIndex}`);
      params.push(categoryId);
      paramIndex++;
    }

    if (type) {
      conditions.push(`e.type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const result = await query(
      `SELECT 
        e.*,
        c.name as category_name
       FROM expenses e
       LEFT JOIN categories c ON e.category_id = c.id
       WHERE ${whereClause}
       ORDER BY e.date DESC`,
      params
    );

    const headers = ['Date', 'Type', 'Category', 'Merchant', 'Amount', 'Currency', 'Payment Method', 'Description', 'Notes'];
    const csvRows = [headers.join(',')];

    for (const exp of result.rows) {
      const dateStr = format(new Date(exp.date), 'yyyy-MM-dd');
      const row = [
        dateStr,
        exp.type,
        `"${(exp.category_name || 'Uncategorized').replace(/"/g, '""')}"`,
        `"${(exp.merchant || '').replace(/"/g, '""')}"`,
        Number(exp.amount).toFixed(2),
        exp.currency || 'INR',
        `"${(exp.payment_method || '').replace(/"/g, '""')}"`,
        `"${(exp.description || '').replace(/"/g, '""')}"`,
        `"${(exp.notes || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    }

    const csvData = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="expense-report.csv"');
    res.status(200).send(csvData);
  } catch (error: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};
