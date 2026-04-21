-- Family CFO - Multi-user schema
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS financial_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL DEFAULT '2026 Family Plan',
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_financial_plans_user_id ON financial_plans(user_id);

CREATE TABLE IF NOT EXISTS financial_groups (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'personal',
  color TEXT NOT NULL DEFAULT '#16a34a',
  icon TEXT NOT NULL DEFAULT '🏠',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS financial_groups_user_id ON financial_groups(user_id);

-- Migration: ALTER TABLE transactions ADD COLUMN IF NOT EXISTS group_id TEXT;
-- Run the above if upgrading an existing schema.

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL,
  normalized_merchant TEXT NOT NULL DEFAULT '',
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL,
  category_id TEXT NOT NULL DEFAULT 'other',
  subcategory_id TEXT,
  account_id TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'csv_upload',
  tags TEXT[] NOT NULL DEFAULT '{}',
  confidence NUMERIC(4,3) NOT NULL DEFAULT 0,
  is_manual_override BOOLEAN NOT NULL DEFAULT false,
  group_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_user_date ON transactions(user_id, date DESC);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  institution TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS accounts_user_id ON accounts(user_id);

CREATE TABLE IF NOT EXISTS account_balances (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  balance NUMERIC(12,2) NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS account_balances_user_id ON account_balances(user_id);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  month_key TEXT NOT NULL,
  rollover BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category_id, month_key)
);
CREATE INDEX IF NOT EXISTS budgets_user_id ON budgets(user_id);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC(12,2) NOT NULL,
  current_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  deadline TIMESTAMPTZ,
  icon TEXT NOT NULL DEFAULT '🎯',
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS goals_user_id ON goals(user_id);

CREATE TABLE IF NOT EXISTS recurring_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  merchant_name TEXT NOT NULL,
  normalized_merchant TEXT NOT NULL,
  category_id TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  frequency TEXT NOT NULL,
  next_due_date TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  is_manually_added BOOLEAN NOT NULL DEFAULT false,
  auto_detected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS recurring_items_user_id ON recurring_items(user_id);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS reports_user_id ON reports(user_id);
