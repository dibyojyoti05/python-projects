import request from 'supertest';
import app from '../server';
import { pool, initDatabase } from '../db';

describe('Expense Tracker API End-to-End Tests', () => {
  let token: string;
  let userId: string;
  let testEmail: string;
  let categoryId: string;
  let expenseId: string;
  let budgetId: string;
  let recurringId: string;

  beforeAll(async () => {
    await initDatabase();
    testEmail = `testuser_${Date.now()}@example.com`;
  });

  afterAll(async () => {
    if (userId) {
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    }
    await pool.end();
  });

  describe('1. Health Check', () => {
    it('should return 200 OK and postgresql database status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.database).toBe('postgresql');
    });
  });

  describe('2. Authentication & Category Seeding', () => {
    it('should register a new user and auto-seed 10 default categories', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Postgres Tester',
          email: testEmail,
          password: 'securePassword123'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe(testEmail.toLowerCase());

      token = res.body.token;
      userId = res.body.id;

      // Verify categories were auto-seeded for this user
      const catRes = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(catRes.status).toBe(200);
      expect(catRes.body.length).toBe(10);
      categoryId = catRes.body[0].id;
    });

    it('should login the registered user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'securePassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.id).toBe(userId);
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'wrongPassword'
        });

      expect(res.status).toBe(401);
    });

    it('should fetch authenticated user profile at /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(userId);
      expect(res.body.name).toBe('Postgres Tester');
    });
  });

  describe('3. Category Management', () => {
    let customCatId: string;

    it('should create a custom category', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Freelancing',
          icon: 'Laptop',
          color: '#10B981',
          type: 'income'
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Freelancing');
      expect(res.body.type).toBe('income');
      customCatId = res.body.id;
    });

    it('should update custom category', async () => {
      const res = await request(app)
        .put(`/api/categories/${customCatId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Freelance & Consulting',
          color: '#059669'
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Freelance & Consulting');
    });

    it('should delete custom category', async () => {
      const res = await request(app)
        .delete(`/api/categories/${customCatId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');
    });
  });

  describe('4. Expense CRUD & Filtering', () => {
    it('should create a new expense', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 450.75,
          currency: 'INR',
          categoryId,
          merchant: 'Starbucks Coffee',
          description: 'Morning latte and sandwich',
          date: new Date().toISOString(),
          paymentMethod: 'UPI',
          type: 'expense',
          notes: 'Team breakfast'
        });

      expect(res.status).toBe(201);
      expect(res.body.amount).toBe(450.75);
      expect(res.body.merchant).toBe('Starbucks Coffee');
      expect(res.body.categoryId).toBeDefined();
      expect(res.body.categoryId.name).toBeDefined();
      expenseId = res.body.id;
    });

    it('should create an income transaction', async () => {
      const res = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 50000,
          currency: 'INR',
          merchant: 'ACME Corp',
          description: 'Monthly Salary',
          date: new Date().toISOString(),
          paymentMethod: 'Net Banking',
          type: 'income'
        });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe('income');
      expect(res.body.amount).toBe(50000);
    });

    it('should list expenses with search, pagination, and sorting', async () => {
      const res = await request(app)
        .get('/api/expenses?search=Starbucks&page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].merchant).toBe('Starbucks Coffee');
    });

    it('should update an existing expense', async () => {
      const res = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 520.00,
          notes: 'Updated receipt amount'
        });

      expect(res.status).toBe(200);
      expect(res.body.amount).toBe(520.00);
      expect(res.body.notes).toBe('Updated receipt amount');
    });

    it('should get expense by ID', async () => {
      const res = await request(app)
        .get(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(expenseId);
      expect(res.body.merchant).toBe('Starbucks Coffee');
    });
  });

  describe('5. Budgets & Spent Aggregation', () => {
    it('should create a category budget and dynamically track spent amounts', async () => {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${token}`)
        .send({
          categoryId,
          amount: 2000,
          currency: 'INR',
          period: 'monthly',
          alertThreshold: 80
        });

      expect(res.status).toBe(201);
      expect(res.body.amount).toBe(2000);
      budgetId = res.body.id;

      // Get budgets and check spentAmount matches expense created
      const listRes = await request(app)
        .get('/api/budgets')
        .set('Authorization', `Bearer ${token}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.length).toBeGreaterThanOrEqual(1);
      const targetBudget = listRes.body.find((b: any) => b.id === budgetId);
      expect(targetBudget).toBeDefined();
      expect(targetBudget.spentAmount).toBe(520.00); // from updated expense!
    });

    it('should update budget amount', async () => {
      const res = await request(app)
        .put(`/api/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          amount: 3000
        });

      expect(res.status).toBe(200);
      expect(res.body.amount).toBe(3000);
    });
  });

  describe('6. Analytics & Spending Trends', () => {
    it('should return dashboard summary with accurate metrics', async () => {
      const res = await request(app)
        .get('/api/analytics/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.totalExpenseThisMonth).toBeGreaterThanOrEqual(520);
      expect(res.body.totalIncomeThisMonth).toBeGreaterThanOrEqual(50000);
      expect(res.body.balance).toBeGreaterThan(0);
      expect(res.body.expenseCountThisMonth).toBeGreaterThanOrEqual(1);
    });

    it('should return category breakdown for pie charts', async () => {
      const res = await request(app)
        .get('/api/analytics/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0]).toHaveProperty('name');
      expect(res.body[0]).toHaveProperty('total');
      expect(res.body[0]).toHaveProperty('color');
    });

    it('should return 6-month spending trends', async () => {
      const res = await request(app)
        .get('/api/analytics/trends')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0]).toHaveProperty('label');
      expect(res.body[0]).toHaveProperty('total');
    });
  });

  describe('7. Recurring Expenses', () => {
    it('should create recurring expense rule', async () => {
      const res = await request(app)
        .post('/api/recurring')
        .set('Authorization', `Bearer ${token}`)
        .send({
          categoryId,
          amount: 999,
          merchant: 'Netflix Subscription',
          frequency: 'monthly',
          startDate: new Date().toISOString(),
          paymentMethod: 'Credit Card',
          description: 'Premium 4K streaming'
        });

      expect(res.status).toBe(201);
      expect(res.body.merchant).toBe('Netflix Subscription');
      expect(res.body.amount).toBe(999);
      recurringId = res.body.id;
    });

    it('should process due recurring expenses', async () => {
      const res = await request(app)
        .post('/api/recurring/process')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('processedCount');
    });

    it('should list recurring rules', async () => {
      const res = await request(app)
        .get('/api/recurring')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('8. Reports & CSV Export', () => {
    it('should return filtered expense report', async () => {
      const res = await request(app)
        .get('/api/reports/expenses')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should export transactions to CSV', async () => {
      const res = await request(app)
        .post('/api/reports/export')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Date,Type,Category,Merchant,Amount');
      expect(res.text).toContain('Starbucks Coffee');
    });
  });

  describe('9. AI Natural Language Parse', () => {
    it('should parse expense text into structured JSON', async () => {
      const res = await request(app)
        .post('/api/ai/parse-expense')
        .set('Authorization', `Bearer ${token}`)
        .send({
          text: 'Spent 650 on Food at Domino Pizza today via UPI'
        });

      expect(res.status).toBe(200);
      expect(res.body.amount).toBe(650);
      expect(res.body.paymentMethod).toBe('UPI');
      expect(res.body.merchant).toContain('Domino');
    });
  });

  describe('10. Clean-up Cascade Deletions', () => {
    it('should delete expense and budget', async () => {
      const delExp = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(delExp.status).toBe(200);

      const delBud = await request(app)
        .delete(`/api/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(delBud.status).toBe(200);

      const delRec = await request(app)
        .delete(`/api/recurring/${recurringId}`)
        .set('Authorization', `Bearer ${token}`);
      expect(delRec.status).toBe(200);
    });
  });
});
