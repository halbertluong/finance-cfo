import { Transaction, RecurringTransaction, RecurringFrequency } from '@/models/types';
import { v4 as uuidv4 } from 'uuid';

function estimateFrequency(dates: Date[]): RecurringFrequency | null {
  if (dates.length < 2) return null;
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push((sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24));
  }
  const median = gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)];
  if (median >= 6 && median <= 8) return 'weekly';
  if (median >= 13 && median <= 16) return 'biweekly';
  if (median >= 27 && median <= 33) return 'monthly';
  if (median >= 85 && median <= 95) return 'quarterly';
  if (median >= 350 && median <= 380) return 'annual';
  return null;
}

export function getNextDueDate(lastDate: Date, frequency: RecurringFrequency): Date {
  const d = new Date(lastDate);
  switch (frequency) {
    case 'weekly': d.setDate(d.getDate() + 7); break;
    case 'biweekly': d.setDate(d.getDate() + 14); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'annual': d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

export function detectRecurringTransactions(
  transactions: Transaction[],
  existingIds: Set<string> = new Set()
): RecurringTransaction[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 120); // look back 4 months

  const recent = transactions.filter(
    (t) => t.type === 'debit' && new Date(t.date) >= cutoff && t.categoryId !== 'transfer'
  );

  const byMerchant = new Map<string, Transaction[]>();
  for (const t of recent) {
    const key = t.normalizedMerchant || t.description;
    const arr = byMerchant.get(key) ?? [];
    arr.push(t);
    byMerchant.set(key, arr);
  }

  const results: RecurringTransaction[] = [];

  for (const [merchant, txs] of byMerchant.entries()) {
    if (txs.length < 2) continue;
    const dates = txs.map((t) => new Date(t.date));
    const frequency = estimateFrequency(dates);
    if (!frequency) continue;

    const sorted = [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastTx = sorted[0];
    const amounts = txs.map((t) => t.amount);
    const avgAmount = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const lastSeen = new Date(lastTx.date);

    // Skip if already tracked
    if (existingIds.has(merchant)) continue;

    results.push({
      id: uuidv4(),
      merchantName: merchant,
      normalizedMerchant: merchant,
      categoryId: lastTx.categoryId,
      amount: Math.round(avgAmount * 100) / 100,
      frequency,
      nextDueDate: getNextDueDate(lastSeen, frequency),
      lastSeenDate: lastSeen,
      active: true,
      isManuallyAdded: false,
      autoDetected: true,
    });
  }

  return results;
}
