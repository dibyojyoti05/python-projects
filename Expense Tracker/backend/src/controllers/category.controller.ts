import { Response } from 'express';
import { z } from 'zod';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth.middleware';
import { Category } from '../models/types';

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  icon: z.string().optional(),
  color: z.string().optional(),
  type: z.enum(['expense', 'income']).optional()
});

const formatCategory = (row: any) => ({
  ...row,
  _id: row.id,
  isDefault: row.is_default
});

export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const result = await query<Category>(
      'SELECT * FROM categories WHERE user_id = $1 ORDER BY type ASC, name ASC',
      [userId]
    );

    res.json(result.rows.map(formatCategory));
  } catch (error: any) {
    console.error('getCategories error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const validatedData = categorySchema.parse(req.body);

    const existing = await query(
      'SELECT id FROM categories WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
      [userId, validatedData.name.trim()]
    );

    if (existing.rows.length > 0) {
      res.status(400).json({ error: { code: 'DUPLICATE_CATEGORY', message: 'Category with this name already exists' } });
      return;
    }

    const result = await query<Category>(
      `INSERT INTO categories (user_id, name, icon, color, type, is_default)
       VALUES ($1, $2, $3, $4, $5, FALSE)
       RETURNING *`,
      [
        userId,
        validatedData.name.trim(),
        validatedData.icon || 'Tag',
        validatedData.color || '#6B7280',
        validatedData.type || 'expense'
      ]
    );

    res.status(201).json(formatCategory(result.rows[0]));
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } });
    } else {
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }
};

export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const categoryId = req.params.id;
    const validatedData = categorySchema.partial().parse(req.body);

    // Verify ownership
    const cat = await query('SELECT * FROM categories WHERE id = $1 AND user_id = $2', [categoryId, userId]);
    if (cat.rows.length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Category not found' } });
      return;
    }

    if (validatedData.name) {
      const duplicate = await query(
        'SELECT id FROM categories WHERE user_id = $1 AND LOWER(name) = LOWER($2) AND id != $3',
        [userId, validatedData.name.trim(), categoryId]
      );
      if (duplicate.rows.length > 0) {
        res.status(400).json({ error: { code: 'DUPLICATE_CATEGORY', message: 'Category name already exists' } });
        return;
      }
    }

    const current = cat.rows[0];
    const name = validatedData.name !== undefined ? validatedData.name.trim() : current.name;
    const icon = validatedData.icon !== undefined ? validatedData.icon : current.icon;
    const color = validatedData.color !== undefined ? validatedData.color : current.color;
    const type = validatedData.type !== undefined ? validatedData.type : current.type;

    const result = await query<Category>(
      `UPDATE categories
       SET name = $1, icon = $2, color = $3, type = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [name, icon, color, type, categoryId, userId]
    );

    res.json(formatCategory(result.rows[0]));
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } });
    } else {
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const categoryId = req.params.id;

    const result = await query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
      [categoryId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Category not found' } });
      return;
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
  }
};
