import { Budget, BudgetStatus, Transaction } from '@/models/types';

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthKeyToDate(key: string): Date {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

export function formatMonthKey(key: string): string {
  const d = monthKeyToDate(key);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function prevMonthKey(key: string): string {
  const d = monthKeyToDate(key);
  d.setMonth(d.getMonth() - 1);
  return monthKey(d);
}

export function nextMonthKey(key: string): string {
  const d = monthKeyToDate(key);
  d.setMonth(d.getMonth() + 1);
  return monthKey(d);
}

export function getSpentForCategory(
  categoryId: string,
  monthKey: string,
  transactions: Transaction[]
): number {
  const [year, month] = monthKey.split('-').map(Number);
  return transactions
    .filter((t) => {
      const d = new Date(t.date);
      return (
        t.categoryId === categoryId &&
        t.type === 'debit' &&
        d.getFullYear() === year &&
        d.getMonth() + 1 === month
      );
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

export function computeBudgetStatus(
  budget: Budget,
  transactions: Transaction[],
  prevMonthBudget?: Budget
): BudgetStatus {
  const spent = getSpentForCategory(budget.categoryId, budget.monthKey, transactions);

  let rolloverAmount = 0;
  if (budget.rollover && prevMonthBudget) {
    const prevSpent = getSpentForCategory(
      prevMonthBudget.categoryId,
      prevMonthBudget.monthKey,
      transactions
    );
    const leftover = prevMonthBudget.amount - prevSpent;
    rolloverAmount = Math.max(0, leftover);
  }

  const effectiveLimit = budget.amount + rolloverAmount;
  const remaining = effectiveLimit - spent;
  const percentUsed = effectiveLimit > 0 ? (spent / effectiveLimit) * 100 : 0;

  return {
    budget,
    spent,
    remaining,
    percentUsed,
    isOver: spent > effectiveLimit,
    rolloverAmount,
  };
}

export function getAvailableMonthKeys(transactions: Transaction[]): string[] {
  const keys = new Set<string>();
  for (const t of transactions) {
    keys.add(monthKey(new Date(t.date)));
  }
  return Array.from(keys).sort().reverse();
}
