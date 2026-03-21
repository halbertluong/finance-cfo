import postgres from 'postgres';
import {
  Transaction,
  Budget,
  Goal,
  Account,
  AccountBalance,
  RecurringTransaction,
  AnalysisReport,
} from '@/models/types';

let _sql: ReturnType<typeof postgres> | null = null;

function sql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    _sql = postgres(url, { ssl: 'require' });
  }
  return _sql;
}

// ─── Transactions ────────────────────────────────────────────────────────────

export async function dbSaveTransactions(userId: string, txs: Transaction[]): Promise<void> {
  if (txs.length === 0) return;
  const db = sql();
  const CHUNK = 500;
  for (let i = 0; i < txs.length; i += CHUNK) {
    const chunk = txs.slice(i, i + CHUNK);
    await db`
      INSERT INTO transactions ${db(
        chunk.map((t) => ({
          id: t.id,
          user_id: userId,
          date: t.date instanceof Date ? t.date : new Date(t.date as unknown as number),
          description: t.description,
          normalized_merchant: t.normalizedMerchant,
          amount: t.amount,
          type: t.type,
          category_id: t.categoryId,
          subcategory_id: t.subcategoryId ?? null,
          account_id: t.accountId,
          source: t.source,
          tags: t.tags,
          confidence: t.confidence,
          is_manual_override: t.isManualOverride,
        }))
      )}
      ON CONFLICT (id) DO UPDATE SET
        category_id = EXCLUDED.category_id,
        subcategory_id = EXCLUDED.subcategory_id,
        account_id = EXCLUDED.account_id,
        tags = EXCLUDED.tags,
        confidence = EXCLUDED.confidence,
        is_manual_override = EXCLUDED.is_manual_override
    `;
  }
}

export async function dbLoadTransactions(userId: string): Promise<Transaction[]> {
  const db = sql();
  const rows = await db`
    SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY date DESC
  `;
  return rows.map(rowToTransaction);
}

export async function dbUpdateTransactionCategory(
  userId: string,
  txId: string,
  categoryId: string
): Promise<void> {
  const db = sql();
  await db`
    UPDATE transactions
    SET category_id = ${categoryId}, is_manual_override = true
    WHERE id = ${txId} AND user_id = ${userId}
  `;
}

export async function dbHasAnyData(userId: string): Promise<boolean> {
  const db = sql();
  const rows = await db`SELECT 1 FROM transactions WHERE user_id = ${userId} LIMIT 1`;
  return rows.length > 0;
}

function rowToTransaction(r: Record<string, unknown>): Transaction {
  return {
    id: r.id as string,
    date: new Date(r.date as string),
    description: r.description as string,
    normalizedMerchant: r.normalized_merchant as string,
    amount: parseFloat(r.amount as string),
    type: r.type as Transaction['type'],
    categoryId: r.category_id as string,
    subcategoryId: r.subcategory_id as string | undefined,
    accountId: r.account_id as string,
    source: r.source as Transaction['source'],
    tags: (r.tags as string[]) ?? [],
    confidence: parseFloat(r.confidence as string),
    isManualOverride: r.is_manual_override as boolean,
  };
}

// ─── Accounts ────────────────────────────────────────────────────────────────

export async function dbSaveAccount(userId: string, account: Account): Promise<void> {
  const db = sql();
  await db`
    INSERT INTO accounts ${db({
      id: account.id,
      user_id: userId,
      name: account.name,
      type: account.type,
      institution: account.institution,
      color: '#6366f1',
    })}
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      type = EXCLUDED.type,
      institution = EXCLUDED.institution
  `;
}

export async function dbLoadAccounts(userId: string): Promise<Account[]> {
  const db = sql();
  const rows = await db`SELECT * FROM accounts WHERE user_id = ${userId} ORDER BY created_at`;
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    type: r.type as Account['type'],
    institution: r.institution as string,
    isAsset: (r.type as string) !== 'credit' && (r.type as string) !== 'loan',
  }));
}

export async function dbRemoveAccount(userId: string, id: string): Promise<void> {
  const db = sql();
  await db`DELETE FROM accounts WHERE id = ${id} AND user_id = ${userId}`;
}

// ─── Account Balances ─────────────────────────────────────────────────────────

export async function dbSaveAccountBalance(userId: string, bal: AccountBalance): Promise<void> {
  const db = sql();
  await db`
    INSERT INTO account_balances ${db({
      id: bal.id,
      user_id: userId,
      account_id: bal.accountId,
      balance: bal.balance,
      date: bal.date instanceof Date ? bal.date : new Date(bal.date as unknown as number),
    })}
    ON CONFLICT (id) DO UPDATE SET balance = EXCLUDED.balance, date = EXCLUDED.date
  `;
}

export async function dbLoadLatestBalances(userId: string): Promise<AccountBalance[]> {
  const db = sql();
  const rows = await db`
    SELECT DISTINCT ON (account_id) *
    FROM account_balances
    WHERE user_id = ${userId}
    ORDER BY account_id, date DESC
  `;
  return rows.map((r) => ({
    id: r.id as string,
    accountId: r.account_id as string,
    balance: parseFloat(r.balance as string),
    date: new Date(r.date as string),
  }));
}

// ─── Budgets ──────────────────────────────────────────────────────────────────

export async function dbSaveBudget(userId: string, budget: Budget): Promise<void> {
  const db = sql();
  await db`
    INSERT INTO budgets ${db({
      id: budget.id,
      user_id: userId,
      category_id: budget.categoryId,
      amount: budget.amount,
      month_key: budget.monthKey,
      rollover: budget.rollover,
    })}
    ON CONFLICT (user_id, category_id, month_key) DO UPDATE SET
      amount = EXCLUDED.amount,
      rollover = EXCLUDED.rollover,
      id = EXCLUDED.id
  `;
}

export async function dbLoadBudgets(userId: string): Promise<Budget[]> {
  const db = sql();
  const rows = await db`SELECT * FROM budgets WHERE user_id = ${userId}`;
  return rows.map((r) => ({
    id: r.id as string,
    categoryId: r.category_id as string,
    amount: parseFloat(r.amount as string),
    monthKey: r.month_key as string,
    rollover: r.rollover as boolean,
    createdAt: new Date(r.created_at as string),
  }));
}

export async function dbRemoveBudget(userId: string, id: string): Promise<void> {
  const db = sql();
  await db`DELETE FROM budgets WHERE id = ${id} AND user_id = ${userId}`;
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export async function dbSaveGoal(userId: string, goal: Goal): Promise<void> {
  const db = sql();
  await db`
    INSERT INTO goals ${db({
      id: goal.id,
      user_id: userId,
      name: goal.name,
      target_amount: goal.targetAmount,
      current_amount: goal.currentAmount,
      deadline: goal.deadline instanceof Date ? goal.deadline : (goal.deadline ? new Date(goal.deadline as unknown as number) : null),
      icon: goal.icon,
      color: goal.color,
    })}
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      target_amount = EXCLUDED.target_amount,
      current_amount = EXCLUDED.current_amount,
      deadline = EXCLUDED.deadline,
      icon = EXCLUDED.icon,
      color = EXCLUDED.color
  `;
}

export async function dbLoadGoals(userId: string): Promise<Goal[]> {
  const db = sql();
  const rows = await db`SELECT * FROM goals WHERE user_id = ${userId} ORDER BY created_at`;
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    targetAmount: parseFloat(r.target_amount as string),
    currentAmount: parseFloat(r.current_amount as string),
    deadline: r.deadline ? new Date(r.deadline as string) : undefined,
    icon: r.icon as string,
    color: r.color as string,
    createdAt: new Date(r.created_at as string),
  }));
}

export async function dbRemoveGoal(userId: string, id: string): Promise<void> {
  const db = sql();
  await db`DELETE FROM goals WHERE id = ${id} AND user_id = ${userId}`;
}

// ─── Recurring Items ──────────────────────────────────────────────────────────

export async function dbSaveRecurring(userId: string, r: RecurringTransaction): Promise<void> {
  const db = sql();
  const nextDue = r.nextDueDate instanceof Date ? r.nextDueDate : (r.nextDueDate ? new Date(r.nextDueDate as unknown as number) : null);
  await db`
    INSERT INTO recurring_items ${db({
      id: r.id,
      user_id: userId,
      merchant_name: r.merchantName,
      normalized_merchant: r.normalizedMerchant,
      category_id: r.categoryId,
      amount: r.amount,
      frequency: r.frequency,
      next_due_date: nextDue,
      active: r.active,
      is_manually_added: r.isManuallyAdded,
      auto_detected: r.autoDetected,
    })}
    ON CONFLICT (id) DO UPDATE SET
      merchant_name = EXCLUDED.merchant_name,
      normalized_merchant = EXCLUDED.normalized_merchant,
      category_id = EXCLUDED.category_id,
      amount = EXCLUDED.amount,
      frequency = EXCLUDED.frequency,
      next_due_date = EXCLUDED.next_due_date,
      active = EXCLUDED.active,
      is_manually_added = EXCLUDED.is_manually_added,
      auto_detected = EXCLUDED.auto_detected
  `;
}

export async function dbLoadRecurring(userId: string): Promise<RecurringTransaction[]> {
  const db = sql();
  const rows = await db`SELECT * FROM recurring_items WHERE user_id = ${userId} ORDER BY created_at`;
  return rows.map((r) => ({
    id: r.id as string,
    merchantName: r.merchant_name as string,
    normalizedMerchant: r.normalized_merchant as string,
    categoryId: r.category_id as string,
    amount: parseFloat(r.amount as string),
    frequency: r.frequency as RecurringTransaction['frequency'],
    nextDueDate: r.next_due_date ? new Date(r.next_due_date as string) : undefined,
    active: r.active as boolean,
    isManuallyAdded: r.is_manually_added as boolean,
    autoDetected: r.auto_detected as boolean,
  }));
}

export async function dbRemoveRecurring(userId: string, id: string): Promise<void> {
  const db = sql();
  await db`DELETE FROM recurring_items WHERE id = ${id} AND user_id = ${userId}`;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function dbSaveReport(userId: string, report: AnalysisReport): Promise<void> {
  const db = sql();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db`
    INSERT INTO reports ${db({ id: report.id, user_id: userId, data: db.json(report as any) })}
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
  `;
}

export async function dbLoadLatestReport(userId: string): Promise<AnalysisReport | null> {
  const db = sql();
  const rows = await db`
    SELECT data FROM reports WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1
  `;
  return rows.length > 0 ? (rows[0].data as AnalysisReport) : null;
}
