import jwt from 'jsonwebtoken';
import { Response } from 'express';

const generateTokens = (res: Response, userId: string): string => {
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_expense_tracker_2026';
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_key_expense_tracker_2026';

  const accessToken = jwt.sign(
    { id: userId },
    secret,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as jwt.SignOptions['expiresIn'] }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    refreshSecret,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
  );

  // Set refresh token in HttpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return accessToken;
};

export default generateTokens;
