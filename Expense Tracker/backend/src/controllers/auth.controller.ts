import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../db';
import generateTokens from '../utils/jwt';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/types';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: 'Utensils', color: '#EF4444', type: 'expense' },
  { name: 'Groceries', icon: 'ShoppingCart', color: '#F97316', type: 'expense' },
  { name: 'Transport', icon: 'Car', color: '#F59E0B', type: 'expense' },
  { name: 'Utilities & Bills', icon: 'Zap', color: '#3B82F6', type: 'expense' },
  { name: 'Entertainment', icon: 'Film', color: '#8B5CF6', type: 'expense' },
  { name: 'Healthcare', icon: 'HeartPulse', color: '#EC4899', type: 'expense' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#10B981', type: 'expense' },
  { name: 'Salary & Income', icon: 'Briefcase', color: '#22C55E', type: 'income' },
  { name: 'Investments', icon: 'TrendingUp', color: '#06B6D4', type: 'income' },
  { name: 'Miscellaneous', icon: 'HelpCircle', color: '#6B7280', type: 'expense' }
];

export const seedDefaultCategories = async (userId: string): Promise<void> => {
  for (const cat of DEFAULT_CATEGORIES) {
    await query(
      `INSERT INTO categories (user_id, name, icon, color, type, is_default)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       ON CONFLICT (user_id, name) DO NOTHING`,
      [userId, cat.name, cat.icon, cat.color, cat.type]
    );
  }
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body);

    // Check existing
    const existing = await query('SELECT id FROM users WHERE email = $1', [validatedData.email.toLowerCase()]);
    if (existing.rows.length > 0) {
      res.status(400).json({ error: { code: 'USER_EXISTS', message: 'User with this email already exists' } });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validatedData.password, salt);

    const result = await query<User>(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, currency, created_at, updated_at`,
      [validatedData.name, validatedData.email.toLowerCase(), passwordHash]
    );

    const user = result.rows[0];

    // Auto-seed default categories for the new user
    await seedDefaultCategories(user.id);

    const accessToken = generateTokens(res, user.id);

    res.status(201).json({
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      token: accessToken
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } });
    } else {
      console.error('Register error:', error);
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const result = await query<User>(
      'SELECT id, name, email, password_hash, currency FROM users WHERE email = $1',
      [validatedData.email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } });
      return;
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(validatedData.password, user.password_hash);

    if (!isMatch) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } });
      return;
    }

    const accessToken = generateTokens(res, user.id);

    res.json({
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      currency: user.currency,
      token: accessToken
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.issues[0].message } });
    } else {
      console.error('Login error:', error);
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: error.message } });
    }
  }
};

export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
    return;
  }
  res.json({
    _id: req.user.id,
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    currency: req.user.currency
  });
};

export const refreshTokenHandler = async (req: Request, res: Response): Promise<void> => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' } });
    return;
  }

  try {
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_expense_tracker_2026';
    const decoded = jwt.verify(token, refreshSecret) as { id: string };

    const result = await query<User>('SELECT id, name, email, currency FROM users WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
      return;
    }

    const user = result.rows[0];
    const newAccessToken = generateTokens(res, user.id);

    res.json({
      _id: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      token: newAccessToken
    });
  } catch (error) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired refresh token' } });
  }
};
