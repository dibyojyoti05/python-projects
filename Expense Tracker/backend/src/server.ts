import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { initDatabase } from './db';
import { processDueRecurringExpenses } from './controllers/recurring.controller';
import authRoutes from './routes/auth.routes';
import expenseRoutes from './routes/expense.routes';
import categoryRoutes from './routes/category.routes';
import analyticsRoutes from './routes/analytics.routes';
import budgetRoutes from './routes/budget.routes';
import recurringRoutes from './routes/recurring.routes';
import reportRoutes from './routes/report.routes';
import aiRoutes from './routes/ai.routes';

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body & Cookie Parsers
app.use(express.json());
app.use(cookieParser());

// Rate limiting (generous for standard app usage)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests, please try again later.'
});
app.use('/api', limiter);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', database: 'postgresql', message: 'API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);

// Global Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server unhandled error:', err.stack);
  res.status(500).json({
    error: {
      code: 'SERVER_ERROR',
      message: err.message || 'Something went wrong on the server'
    }
  });
});

// Server Initialization
if (process.env.NODE_ENV !== 'test') {
  initDatabase()
    .then(async () => {
      // Run due recurring expenses on startup
      try {
        const count = await processDueRecurringExpenses();
        if (count > 0) {
          console.log(`Processed ${count} due recurring expenses on startup`);
        }
      } catch (recErr) {
        console.warn('Initial recurring check note:', recErr);
      }

      // Schedule recurring expense runner hourly (3600000 ms)
      setInterval(async () => {
        try {
          await processDueRecurringExpenses();
        } catch (err) {
          console.error('Hourly recurring processing error:', err);
        }
      }, 60 * 60 * 1000);

      app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to initialize server database:', err);
      process.exit(1);
    });
}

export default app;
