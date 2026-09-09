# Expense Tracker REST API Documentation

Base URL: `http://localhost:5000/api`

All authenticated endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/register`
Registers a new user account and seeds 10 default categories.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "strongPassword123"
}
```

**Response (201 Created):**
```json
{
  "id": "7bfa2ad1-fcf2-4752-bdae-407cf1f15be7",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "currency": "INR",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### `POST /api/auth/login`
Authenticates a user and issues an access token and refresh cookie.

**Request Body:**
```json
{
  "email": "jane@example.com",
  "password": "strongPassword123"
}
```

### `POST /api/auth/logout`
Clears HTTP-only session refresh cookies.

### `GET /api/auth/me` *(Protected)*
Returns the currently authenticated user profile.

---

## 2. Transactions & Expenses (`/api/expenses`)

### `GET /api/expenses` *(Protected)*
List paginated expenses with full text search and multi-attribute filters.

**Query Parameters:**
- `page` (number, default `1`)
- `limit` (number, default `50`)
- `search` (string: searches merchant, notes, description)
- `categoryId` (UUID)
- `type` (`expense` | `income`)
- `paymentMethod` (string)
- `startDate` (YYYY-MM-DD)
- `endDate` (YYYY-MM-DD)
- `sortBy` (`date` | `amount` | `merchant`, default `date`)
- `order` (`asc` | `desc`, default `desc`)

### `POST /api/expenses` *(Protected)*
Record a new transaction.

**Request Body:**
```json
{
  "amount": 450.00,
  "merchant": "Starbucks Coffee",
  "categoryId": "c4d7d3d1-f343-4c91-...",
  "date": "2026-09-07T12:00:00.000Z",
  "paymentMethod": "UPI",
  "type": "expense",
  "notes": "Afternoon coffee"
}
```

### `GET /api/expenses/:id` *(Protected)*
Retrieve a specific expense by UUID.

### `PUT /api/expenses/:id` *(Protected)*
Update an existing transaction.

### `DELETE /api/expenses/:id` *(Protected)*
Delete a transaction.

---

## 3. Categories (`/api/categories`)

### `GET /api/categories` *(Protected)*
Returns all expense and income categories for the current user.

### `POST /api/categories` *(Protected)*
Create a custom category.

**Request Body:**
```json
{
  "name": "Freelancing",
  "icon": "Briefcase",
  "color": "#10B981",
  "type": "income"
}
```

### `PUT /api/categories/:id` *(Protected)*
Update a custom category.

### `DELETE /api/categories/:id` *(Protected)*
Delete a custom category.

---

## 4. Budgets (`/api/budgets`)

### `GET /api/budgets` *(Protected)*
Returns all budgets along with **real-time calculated `spentAmount`** aggregated from expenses within the current period.

### `POST /api/budgets` *(Protected)*
Set a new budget limit.

**Request Body:**
```json
{
  "categoryId": "c4d7d3d1-...", // null for overall account budget
  "amount": 10000.00,
  "period": "monthly",
  "alertThreshold": 80
}
```

### `PUT /api/budgets/:id` *(Protected)*
Update budget parameters.

### `DELETE /api/budgets/:id` *(Protected)*
Delete a budget.

---

## 5. Recurring Expenses (`/api/recurring`)

### `GET /api/recurring` *(Protected)*
List all repeating subscription and bill rules.

### `POST /api/recurring` *(Protected)*
Create a new recurring schedule rule (`daily`, `weekly`, `monthly`, `yearly`).

### `POST /api/recurring/process` *(Protected)*
Trigger immediate execution of any recurring expenses due today.

---

## 6. Analytics & Reports

### `GET /api/analytics/summary` *(Protected)*
Returns current month expenses, income, net balance, transaction count, previous month percentage delta, and overall budget utilization.

### `GET /api/analytics/categories` *(Protected)*
Returns distribution of spending grouped by category with custom colors for pie charts.

### `GET /api/analytics/trends` *(Protected)*
Returns a 6-month historical monthly breakdown of income and expenses.

### `GET /api/reports/export` & `POST /api/reports/export` *(Protected)*
Generates a direct CSV download of transactions filtered by date range and category.

---

## 7. AI Assistant (`/api/ai`)

### `POST /api/ai/parse-expense` *(Protected)*
Parses natural language transaction text or bank SMS messages into structured transaction JSON fields.
