/**
 * Client-side data access layer — mirrors the dexie.ts interface
 * but fetches from /api/data/* routes instead of IndexedDB.
 */
import {
  Transaction,
  Budget,
  Goal,
  Account,
  AccountBalance,
  RecurringTransaction,
  AnalysisReport,
  FinancialGroup,
} from '@/models/types';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function saveTransactions(txs: Transaction[]): Promise<void> {
  await apiFetch('/api/data/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactions: txs }),
  });
}

export async function loadTransactions(): Promise<Transaction[]> {
  const txs = await apiFetch<Transaction[]>('/api/data/transactions');
  return txs.map((t) => ({ ...t, date: new Date(t.date) }));
}

export async function updateTransactionCategory(
  txId: string,
  categoryId: string
): Promise<void> {
  await apiFetch(`/api/data/transactions/${txId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryId }),
  });
}

export async function bulkUpdateTransactionGroup(
  txIds: string[],
  groupId: string | null
): Promise<void> {
  await apiFetch('/api/data/transactions/bulk-group', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ txIds, groupId }),
  });
}

export async function hasAnyData(): Promise<boolean> {
  const { hasData } = await apiFetch<{ hasData: boolean }>('/api/data/has-data');
  return hasData;
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

export async function saveAccount(account: Account): Promise<void> {
  await apiFetch('/api/data/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(account),
  });
}

export async function loadAccounts(): Promise<Account[]> {
  return apiFetch<Account[]>('/api/data/accounts');
}

export async function removeAccount(id: string): Promise<void> {
  await apiFetch(`/api/data/accounts/${id}`, { method: 'DELETE' });
}

// ─── Account Balances ─────────────────────────────────────────────────────────

export async function saveAccountBalance(bal: AccountBalance): Promise<void> {
  await apiFetch('/api/data/account-balances', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bal),
  });
}

export async function loadLatestBalances(): Promise<AccountBalance[]> {
  const bals = await apiFetch<AccountBalance[]>('/api/data/account-balances');
  return bals.map((b) => ({ ...b, date: new Date(b.date) }));
}

// ─── Budgets ──────────────────────────────────────────────────────────────────

export async function saveBudget(budget: Budget): Promise<void> {
  await apiFetch('/api/data/budgets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(budget),
  });
}

export async function loadBudgets(): Promise<Budget[]> {
  return apiFetch<Budget[]>('/api/data/budgets');
}

export async function removeBudget(id: string): Promise<void> {
  await apiFetch(`/api/data/budgets/${id}`, { method: 'DELETE' });
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export async function saveGoal(goal: Goal): Promise<void> {
  await apiFetch('/api/data/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(goal),
  });
}

export async function loadGoals(): Promise<Goal[]> {
  return apiFetch<Goal[]>('/api/data/goals');
}

export async function removeGoal(id: string): Promise<void> {
  await apiFetch(`/api/data/goals/${id}`, { method: 'DELETE' });
}

// ─── Recurring ────────────────────────────────────────────────────────────────

export async function saveRecurring(r: RecurringTransaction): Promise<void> {
  await apiFetch('/api/data/recurring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(r),
  });
}

export async function loadRecurring(): Promise<RecurringTransaction[]> {
  return apiFetch<RecurringTransaction[]>('/api/data/recurring');
}

export async function removeRecurring(id: string): Promise<void> {
  await apiFetch(`/api/data/recurring/${id}`, { method: 'DELETE' });
}

// ─── Financial Groups ─────────────────────────────────────────────────────────

export async function loadGroups(): Promise<FinancialGroup[]> {
  const groups = await apiFetch<FinancialGroup[]>('/api/data/groups');
  return groups.map((g) => ({ ...g, createdAt: new Date(g.createdAt) }));
}

export async function saveGroup(group: FinancialGroup): Promise<void> {
  await apiFetch('/api/data/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(group),
  });
}

export async function removeGroup(id: string): Promise<void> {
  await apiFetch(`/api/data/groups/${id}`, { method: 'DELETE' });
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function saveReport(report: AnalysisReport): Promise<void> {
  await apiFetch('/api/data/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  });
}

export async function loadLatestReport(): Promise<AnalysisReport | null> {
  const report = await apiFetch<AnalysisReport | null>('/api/data/reports');
  if (!report) return null;
  return {
    ...report,
    generatedAt: new Date(report.generatedAt),
    periodStart: new Date(report.periodStart),
    periodEnd: new Date(report.periodEnd),
    transactions: report.transactions.map((t) => ({ ...t, date: new Date(t.date) })),
  };
}
