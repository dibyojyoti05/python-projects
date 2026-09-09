import { Pool, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Ensure env loaded
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:root@127.0.0.1:5433/expense_tracker';

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (process.env.DEBUG === 'true') {
    console.log('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
  }
  return res;
};

export const initDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    try {
      console.log('PostgreSQL Connected successfully to database');
      // Read and execute database/init.sql to ensure tables and indexes are ready
      const sqlPath = path.resolve(__dirname, '../../../database/init.sql');
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await client.query(sql);
        console.log('PostgreSQL Schema initialized and verified');
      }
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
};

export default {
  pool,
  query,
  initDatabase,
};
