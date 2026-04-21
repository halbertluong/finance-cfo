'use client';

import Dexie, { type Table } from 'dexie';
import {
  Transaction, NetWorthSnapshot, AnalysisReport,
  Budget, Goal, Account, AccountBalance, RecurringTransaction,
  FinancialPlan,
} from '@/models/types';

type TxRow = Transaction & { _date: number };
type NWRow = NetWorthSnapshot & { _date: number };
type ReportRow = AnalysisReport & { _generatedAt: number };
type ABRow = AccountBalance & { _date: number };
type GoalRow = Goal & { _createdAt: number; _deadline?: number; _completedAt?: number };
type BudgetRow = Budget & { _createdAt: number };
type RecurRow = RecurringTransaction & { _nextDue?: number; _lastSeen?: number };
type PlanRow = Omit<FinancialPlan, 'createdAt' | 'updatedAt'> & { _createdAt: number; _updatedAt: number };

export class FinanceDB extends Dexie {
  transactions!: Table<TxRow, string>;
  netWorthSnapshots!: Table<NWRow, string>;
  reports!: Table<ReportRow, string>;
  budgets!: Table<BudgetRow, string>;
  goals!: Table<GoalRow, string>;
  accounts!: Table<Account, string>;
  accountBalances!: Table<ABRow, string>;
  recurringItems!: Table<RecurRow, string>;
  financialPlans!: Table<PlanRow, string>;

  constructor() {
    super('FinanceCFO');
    this.version(1).stores({
      transactions: 'id, categoryId, type, accountId, _date',
      netWorthSnapshots: 'id, _date',
      reports: 'id, _generatedAt',
    });
    this.version(2).stores({
      transactions: 'id, categoryId, type, accountId, _date',
      netWorthSnapshots: 'id, _date',
      reports: 'id, _generatedAt',
      budgets: 'id, categoryId, monthKey',
      goals: 'id, _createdAt',
      accounts: 'id, type, isAsset',
      accountBalances: 'id, accountId, _date',
      recurringItems: 'id, categoryId, active',
    });
    this.version(3).stores({
      transactions: 'id, categoryId, type, accountId, _date',
      netWorthSnapshots: 'id, _date',
      reports: 'id, _generatedAt',
      budgets: 'id, categoryId, monthKey',
      goals: 'id, _createdAt',
      accounts: 'id, type, isAsset',
      accountBalances: 'id, accountId, _date',
      recurringItems: 'id, categoryId, active',
      financialPlans: 'id',
    });
  }
}

let _db: FinanceDB | null = null;
export function getDB(): FinanceDB {
  if (!_db) _db = new FinanceDB();
  return _db;
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function saveTransactions(transactions: Transaction[]): Promise<void> {
  const db = getDB();
  await db.transactions.bulkPut(transactions.map((t) => ({ ...t, _date: t.date.getTime() })));
}

export async function loadTransactions(): Promise<Transaction[]> {
  const db = getDB();
  const rows = await db.transactions.toArray();
  return rows.map(({ _date, ...t }) => ({ ...t, date: new Date(_date) }));
}

export async function updateTransactionCategory(
  id: string,
  categoryId: string,
  subcategoryId?: string
): Promise<void> {
  await getDB().transactions.update(id, { categoryId, subcategoryId, isManualOverride: true, confidence: 1 });
}

export async function clearTransactions(): Promise<void> {
  await getDB().transactions.clear();
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function saveReport(report: AnalysisReport): Promise<void> {
  const db = getDB();
  await db.reports.put({ ...report, _generatedAt: report.generatedAt.getTime() });
}

export async function loadLatestReport(): Promise<AnalysisReport | null> {
  const db = getDB();
  const rows = await db.reports.orderBy('_generatedAt').reverse().limit(1).toArray();
  if (rows.length === 0) return null;
  const { _generatedAt, ...report } = rows[0];
  return {
    ...report,
    generatedAt: new Date(_generatedAt),
    periodStart: new Date(report.periodStart),
    periodEnd: new Date(report.periodEnd),
    transactions: (report.transactions as (Transaction & { _date?: number })[]).map((t) => ({
      ...t,
      date: t._date ? new Date(t._date) : new Date(t.date),
    })),
  } as AnalysisReport;
}

export async function hasAnyData(): Promise<boolean> {
  const db = getDB();
  const count = await db.transactions.count();
  return count > 0;
}

// ─── Budgets ──────────────────────────────────────────────────────────────────

export async function saveBudget(budget: Budget): Promise<void> {
  await getDB().budgets.put({ ...budget, _createdAt: budget.createdAt.getTime() });
}

export async function loadBudgets(monthKey?: string): Promise<Budget[]> {
  const db = getDB();
  const rows = monthKey
    ? await db.budgets.where('monthKey').equals(monthKey).toArray()
    : await db.budgets.toArray();
  return rows.map(({ _createdAt, ...b }) => ({ ...b, createdAt: new Date(_createdAt) }));
}

export async function deleteBudget(id: string): Promise<void> {
  await getDB().budgets.delete(id);
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export async function saveGoal(goal: Goal): Promise<void> {
  await getDB().goals.put({
    ...goal,
    _createdAt: goal.createdAt.getTime(),
    _deadline: goal.deadline?.getTime(),
    _completedAt: goal.completedAt?.getTime(),
  });
}

export async function loadGoals(): Promise<Goal[]> {
  const rows = await getDB().goals.toArray();
  return rows.map(({ _createdAt, _deadline, _completedAt, ...g }) => ({
    ...g,
    createdAt: new Date(_createdAt),
    deadline: _deadline ? new Date(_deadline) : undefined,
    completedAt: _completedAt ? new Date(_completedAt) : undefined,
  }));
}

export async function deleteGoal(id: string): Promise<void> {
  await getDB().goals.delete(id);
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

export async function saveAccount(account: Account): Promise<void> {
  await getDB().accounts.put(account);
}

export async function loadAccounts(): Promise<Account[]> {
  return getDB().accounts.toArray();
}

export async function deleteAccount(id: string): Promise<void> {
  await getDB().accounts.delete(id);
  await getDB().accountBalances.where('accountId').equals(id).delete();
}

// ─── Account Balances ─────────────────────────────────────────────────────────

export async function saveAccountBalance(balance: AccountBalance): Promise<void> {
  await getDB().accountBalances.put({ ...balance, _date: balance.date.getTime() });
}

export async function loadAccountBalances(accountId?: string): Promise<AccountBalance[]> {
  const db = getDB();
  const rows = accountId
    ? await db.accountBalances.where('accountId').equals(accountId).toArray()
    : await db.accountBalances.toArray();
  return rows.map(({ _date, ...b }) => ({ ...b, date: new Date(_date) }));
}

export async function loadLatestBalances(): Promise<Record<string, AccountBalance>> {
  const all = await loadAccountBalances();
  const latest: Record<string, AccountBalance> = {};
  for (const b of all) {
    if (!latest[b.accountId] || b.date > latest[b.accountId].date) {
      latest[b.accountId] = b;
    }
  }
  return latest;
}

// ─── Recurring ────────────────────────────────────────────────────────────────

export async function saveRecurring(item: RecurringTransaction): Promise<void> {
  await getDB().recurringItems.put({
    ...item,
    _nextDue: item.nextDueDate?.getTime(),
    _lastSeen: item.lastSeenDate?.getTime(),
  });
}

export async function loadRecurring(): Promise<RecurringTransaction[]> {
  const rows = await getDB().recurringItems.toArray();
  return rows.map(({ _nextDue, _lastSeen, ...r }) => ({
    ...r,
    nextDueDate: _nextDue ? new Date(_nextDue) : undefined,
    lastSeenDate: _lastSeen ? new Date(_lastSeen) : undefined,
  }));
}

export async function deleteRecurring(id: string): Promise<void> {
  await getDB().recurringItems.delete(id);
}

// ─── Financial Plan ───────────────────────────────────────────────────────────

export async function savePlan(plan: FinancialPlan): Promise<void> {
  await getDB().financialPlans.put({
    ...plan,
    _createdAt: plan.createdAt.getTime(),
    _updatedAt: plan.updatedAt.getTime(),
  } as PlanRow);
}

export async function loadPlan(): Promise<FinancialPlan | null> {
  const rows = await getDB().financialPlans.toArray();
  if (rows.length === 0) return null;
  const { _createdAt, _updatedAt, ...p } = rows[0];
  return { ...p, createdAt: new Date(_createdAt), updatedAt: new Date(_updatedAt) };
}
