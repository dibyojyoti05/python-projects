# PostgreSQL Database Architecture & Schema Documentation

The Expense Tracker application uses **PostgreSQL** (version 14+) as its primary relational database.

- **Host**: `127.0.0.1`
- **Port**: `5433`
- **Database**: `expense_tracker`
- **User**: `postgres`

---

## Entity Relationship Overview

```
                      +-------------------+
                      |       users       |
                      +-------------------+
                                | 1
            +-------------------+-------------------+
            | 1..*              | 1..*              | 1..*
    +---------------+   +---------------+   +-----------------------+
    |  categories   |   |   expenses    |   |        budgets        |
    +---------------+   +---------------+   +-----------------------+
            | 1                 |                   |
            | 0..*              | 0..*              |
            +-------------------+-------------------+
                                | 1..*
                    +-----------------------+
                    |  recurring_expenses   |
                    +-----------------------+
```

---

## Tables & Schemas

### 1. `users`
Stores user profile information, password credentials, and global preferences.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique user identifier |
| `name` | VARCHAR(255) | NOT NULL | User's full name |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Login email (case-insensitive indexed) |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| `currency` | VARCHAR(10) | DEFAULT `'INR'` | Preferred currency code |
| `created_at` | TIMESTAMPTZ | DEFAULT `CURRENT_TIMESTAMP` | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT `CURRENT_TIMESTAMP` | Last profile update timestamp |

**Indexes:**
- `idx_users_email` ON `users(email)`

---

### 2. `categories`
Stores expense and income classification categories per user. When a new user registers, 10 standard categories are automatically provisioned.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique category identifier |
| `user_id` | UUID | REFERENCES `users(id)` ON DELETE CASCADE | Owner user |
| `name` | VARCHAR(100) | NOT NULL | Category name |
| `icon` | VARCHAR(50) | DEFAULT `'Tag'` | Lucide icon identifier |
| `color` | VARCHAR(50) | DEFAULT `'#6B7280'` | Hex color code |
| `type` | VARCHAR(20) | CHECK (`type` IN ('expense', 'income')) | Category flow type |
| `is_default` | BOOLEAN | DEFAULT `FALSE` | System default or custom |
| `created_at` | TIMESTAMPTZ | DEFAULT `CURRENT_TIMESTAMP` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT `CURRENT_TIMESTAMP` | Last modification timestamp |

**Constraints & Indexes:**
- `uq_user_category_name` UNIQUE(`user_id`, `name`)
- `idx_categories_user_id` ON `categories(user_id)`

---

### 3. `expenses`
Stores all financial transactions (both expense and income events).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique transaction identifier |
| `user_id` | UUID | REFERENCES `users(id)` ON DELETE CASCADE | Owner user |
| `category_id` | UUID | REFERENCES `categories(id)` ON DELETE SET NULL | Associated category |
| `amount` | NUMERIC(12, 2) | NOT NULL, CHECK (`amount` > 0) | Transaction value |
| `currency` | VARCHAR(10) | DEFAULT `'INR'` | Currency code |
| `merchant` | VARCHAR(255) | NOT NULL | Vendor, merchant, or payer |
| `description` | TEXT | NULLABLE | Detailed description |
| `date` | TIMESTAMPTZ | NOT NULL | Transaction date |
| `payment_method` | VARCHAR(50) | NOT NULL | UPI, Credit Card, Debit Card, Cash, etc. |
| `type` | VARCHAR(20) | CHECK (`type` IN ('expense', 'income')) | Flow direction |
| `notes` | TEXT | NULLABLE | User notes or tags |
| `tags` | TEXT[] | DEFAULT `'{}'` | String tags array |
| `created_at` | TIMESTAMPTZ | DEFAULT `CURRENT_TIMESTAMP` | Created timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT `CURRENT_TIMESTAMP` | Updated timestamp |

**Indexes:**
- `idx_expenses_user_id` ON `expenses(user_id)`
- `idx_expenses_user_date` ON `expenses(user_id, date DESC)`
- `idx_expenses_category_id` ON `expenses(category_id)`
- `idx_expenses_user_type` ON `expenses(user_id, type)`

---

### 4. `budgets`
Stores monthly or yearly spending limits for either specific categories or account-wide spending.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique budget identifier |
| `user_id` | UUID | REFERENCES `users(id)` ON DELETE CASCADE | Owner user |
| `category_id` | UUID | REFERENCES `categories(id)` ON DELETE CASCADE | NULL = Overall account budget |
| `amount` | NUMERIC(12, 2) | NOT NULL, CHECK (`amount` > 0) | Spending limit |
| `currency` | VARCHAR(10) | DEFAULT `'INR'` | Currency code |
| `period` | VARCHAR(20) | CHECK (`period` IN ('monthly', 'yearly')) | Budget timeframe |
| `month` | INT | CHECK (`month` BETWEEN 1 AND 12) | Optional target month |
| `year` | INT | NULLABLE | Optional target year |
| `alert_threshold` | NUMERIC(5, 2) | DEFAULT 80.0 | Utilization % triggering warnings |
| `created_at` | TIMESTAMPTZ | DEFAULT `CURRENT_TIMESTAMP` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT `CURRENT_TIMESTAMP` | Last update timestamp |

**Constraints & Indexes:**
- `uq_budgets_user_cat_period` UNIQUE(`user_id`, `COALESCE(category_id, ...)` , `period`)
- `idx_budgets_user_id` ON `budgets(user_id)`

---

### 5. `recurring_expenses`
Stores repeating rules (e.g. subscriptions, rent) that automate transaction logging.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique rule identifier |
| `user_id` | UUID | REFERENCES `users(id)` ON DELETE CASCADE | Owner user |
| `category_id` | UUID | REFERENCES `categories(id)` ON DELETE SET NULL | Associated category |
| `amount` | NUMERIC(12, 2) | NOT NULL, CHECK (`amount` > 0) | Recurring amount |
| `currency` | VARCHAR(10) | DEFAULT `'INR'` | Currency code |
| `merchant` | VARCHAR(255) | NOT NULL | Vendor name |
| `description` | TEXT | NULLABLE | Rule description |
| `frequency` | VARCHAR(20) | CHECK (`frequency` IN ('daily', 'weekly', 'monthly', 'yearly')) | Recurrence interval |
| `start_date` | DATE | NOT NULL | First occurrence date |
| `end_date` | DATE | NULLABLE | Optional termination date |
| `next_occurrence` | DATE | NOT NULL | Next date to execute |
| `payment_method` | VARCHAR(50) | NOT NULL | Payment method |
| `is_active` | BOOLEAN | DEFAULT `TRUE` | Active or paused |
| `created_at` | TIMESTAMPTZ | DEFAULT `CURRENT_TIMESTAMP` | Created timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT `CURRENT_TIMESTAMP` | Updated timestamp |

**Indexes:**
- `idx_recurring_user_id` ON `recurring_expenses(user_id)`
- `idx_recurring_due` ON `recurring_expenses(next_occurrence) WHERE is_active = TRUE`

---

## Migration & Initialization

The schema is automatically provisioned at startup via [backend/src/db/index.ts](file:///d:/python%20projects/Expense%20Tracker/backend/src/db/index.ts), which loads and verifies [database/init.sql](file:///d:/python%20projects/Expense%20Tracker/database/init.sql).
