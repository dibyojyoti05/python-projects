export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  currency: string;
  merchant: string;
  description?: string | null;
  date: Date;
  payment_method: string;
  type: 'expense' | 'income';
  notes?: string | null;
  tags?: string[];
  created_at: Date;
  updated_at: Date;
  // Joined category fields
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  category_type?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  currency: string;
  period: 'monthly' | 'yearly';
  month?: number | null;
  year?: number | null;
  alert_threshold: number;
  created_at: Date;
  updated_at: Date;
  // Computed / Joined
  spent_amount?: number;
  category_name?: string | null;
  category_icon?: string | null;
  category_color?: string | null;
}

export interface RecurringExpense {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  currency: string;
  merchant: string;
  description?: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date?: string | null;
  next_occurrence: string;
  payment_method: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  // Joined category
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}
