# Expense Tracker (PostgreSQL Edition)

A modern, full-stack personal finance and expense tracking platform built with TypeScript, Node.js/Express, PostgreSQL, and React.

---

## Architecture & Technology Stack

- **Database**: PostgreSQL 16 (Port `5433`, Database: `expense_tracker`)
- **Backend**: Node.js, Express 5, TypeScript, `pg` (node-postgres), Zod, JWT, bcrypt
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, TanStack React Query, Lucide Icons, Recharts
- **Testing**: Jest, Supertest, `ts-jest`
- **Containerization**: Docker Compose

---

## Features

- **Relational PostgreSQL Database**: Complete normalized relational schema for `users`, `categories`, `expenses`, `budgets`, and `recurring_expenses` with foreign key cascades and indexes.
- **Auto-Seeded Categories**: New user accounts are automatically provisioned with 10 standard categories.
- **Comprehensive Expense Management**: Create, edit, and delete transactions with multi-filter queries (search, date range, category, payment method, type).
- **Dynamic Budget Tracking**: Real-time aggregation of expenses against budget caps, visual progress bars, and alert threshold warnings.
- **Recurring Expenses Engine**: Scheduled recurring rules with automated hourly execution and manual run triggers.
- **Interactive Analytics**: Monthly expense and income summaries, category distribution pie charts, and 6-month financial trend charts.
- **AI-Powered Natural Language Parser**: Extract expense details from SMS messages or conversational text, pre-fill transactions, and save in 1 click.
- **CSV Statements & Reporting**: Custom date-range statement previews and one-click CSV export.

---

## Getting Started

### 1. Database Setup

Ensure PostgreSQL is running on `127.0.0.1:5433` with user `postgres` and password `root`.

Database and tables are automatically provisioned on backend startup via [database/init.sql](file:///d:/python%20projects/Expense%20Tracker/database/init.sql).

### 2. Backend Setup

```bash
cd backend
npm install --legacy-peer-deps
npm run build
npm run dev
```

Server runs at `http://localhost:5000`.

To run backend integration tests:
```bash
npm test
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

---

## Documentation

- [docs/DATABASE.md](file:///d:/python%20projects/Expense%20Tracker/docs/DATABASE.md): Detailed database schema and entity relationships.
- [docs/API.md](file:///d:/python%20projects/Expense%20Tracker/docs/API.md): Comprehensive REST API endpoint reference.
