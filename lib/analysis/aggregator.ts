import { Transaction, CategoryAnalysis, MerchantSummary, MonthlyAmount } from '@/models/types';
import { CATEGORIES } from '@/lib/categories';

export function aggregateByCategory(transactions: Transaction[]): CategoryAnalysis[] {
  const expenses = transactions.filter((t) => t.type === 'debit' && t.categoryId !== 'transfer');
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);

  const byCategory = new Map<string, Transaction[]>();
  for (const t of expenses) {
    const arr = byCategory.get(t.categoryId) ?? [];
    arr.push(t);
    byCategory.set(t.categoryId, arr);
  }

  return CATEGORIES.filter((c) => c.type !== 'income' && c.type !== 'transfer')
    .map((cat) => {
      const txs = byCategory.get(cat.id) ?? [];
      if (txs.length === 0) return null;

      const totalSpent = txs.reduce((s, t) => s + t.amount, 0);
      const monthlyBreakdown = buildMonthlyBreakdown(txs);
      const trend = detectTrend(monthlyBreakdown);
      const topMerchants = buildTopMerchants(txs);

      return {
        categoryId: cat.id,
        totalSpent,
        transactionCount: txs.length,
        percentOfTotal: totalExpenses > 0 ? (totalSpent / totalExpenses) * 100 : 0,
        monthlyBreakdown,
        trend: trend.direction,
        trendPercent: trend.percent,
        topMerchants,
        score: { score: 0, grade: 'C' as const, insight: '' }, // filled by gamification
      };
    })
    .filter(Boolean) as CategoryAnalysis[];
}

function buildMonthlyBreakdown(transactions: Transaction[]): MonthlyAmount[] {
  const map = new Map<string, number>();
  for (const t of transactions) {
    const d = t.date instanceof Date ? t.date : new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    map.set(key, (map.get(key) ?? 0) + t.amount);
  }
  return Array.from(map.entries())
    .map(([key, amount]) => {
      const [year, month] = key.split('-').map(Number);
      return { year, month, amount };
    })
    .sort((a, b) => a.year - b.year || a.month - b.month);
}

function detectTrend(monthly: MonthlyAmount[]): { direction: 'increasing' | 'decreasing' | 'stable'; percent: number } {
  if (monthly.length < 2) return { direction: 'stable', percent: 0 };
  const half = Math.floor(monthly.length / 2);
  const firstHalf = monthly.slice(0, half).reduce((s, m) => s + m.amount, 0) / half;
  const secondHalf = monthly.slice(half).reduce((s, m) => s + m.amount, 0) / (monthly.length - half);
  const percent = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;
  const direction = percent > 5 ? 'increasing' : percent < -5 ? 'decreasing' : 'stable';
  return { direction, percent };
}

function buildTopMerchants(transactions: Transaction[]): MerchantSummary[] {
  const map = new Map<string, { total: number; count: number }>();
  for (const t of transactions) {
    const key = t.normalizedMerchant || t.description;
    const entry = map.get(key) ?? { total: 0, count: 0 };
    entry.total += t.amount;
    entry.count += 1;
    map.set(key, entry);
  }
  return Array.from(map.entries())
    .map(([merchant, { total, count }]) => ({
      merchant,
      totalSpent: total,
      visitCount: count,
      averageTransaction: total / count,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);
}

export function getTotalIncome(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'credit' && t.categoryId !== 'transfer')
    .reduce((s, t) => s + t.amount, 0);
}

export function getTotalExpenses(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === 'debit' && t.categoryId !== 'transfer')
    .reduce((s, t) => s + t.amount, 0);
}

export function getTopMerchants(transactions: Transaction[], limit = 10): MerchantSummary[] {
  const expenses = transactions.filter((t) => t.type === 'debit' && t.categoryId !== 'transfer');
  return buildTopMerchants(expenses).slice(0, limit);
}

export function getMonthlySpendingData(transactions: Transaction[]) {
  const months = new Map<string, { income: number; expenses: number }>();
  for (const t of transactions) {
    if (t.categoryId === 'transfer') continue;
    const d = t.date instanceof Date ? t.date : new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const entry = months.get(key) ?? { income: 0, expenses: 0 };
    if (t.type === 'credit') entry.income += t.amount;
    else entry.expenses += t.amount;
    months.set(key, entry);
  }
  return Array.from(months.entries())
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
