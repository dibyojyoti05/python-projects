import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';
import { User } from '../models/types';

export interface AuthRequest extends Request {
  user?: User;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_expense_tracker_2026';
      const decoded = jwt.verify(token, secret) as { id: string };

      const result = await query<User>(
        'SELECT id, name, email, currency, created_at, updated_at FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
        return;
      }

      req.user = result.rows[0];
      next();
      return;
    } catch (error) {
      console.error('JWT verification failed:', error);
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authorized, invalid token' } });
      return;
    }
  }

  res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authorized, no token provided' } });
};
