import { v4 as uuidv4 } from 'uuid';
import { parse, isValid } from 'date-fns';
import { RawTransaction, Transaction, ColumnMapping } from '@/models/types';

const DATE_FORMATS = [
  'MM/dd/yyyy',
  'M/d/yyyy',
  'yyyy-MM-dd',
  'MM-dd-yyyy',
  'dd/MM/yyyy',
  'MMMM d, yyyy',
  'MMM d, yyyy',
  'MM/dd/yy',
];

function parseDate(raw: string): Date {
  const trimmed = raw.trim();
  for (const fmt of DATE_FORMATS) {
    const parsed = parse(trimmed, fmt, new Date());
    if (isValid(parsed)) return parsed;
  }
  const fallback = new Date(trimmed);
  if (isValid(fallback)) return fallback;
  throw new Error(`Cannot parse date: "${raw}"`);
}

function parseAmount(raw: string): { amount: number; type: 'debit' | 'credit' } {
  const cleaned = raw.replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) throw new Error(`Cannot parse amount: "${raw}"`);
  // Negative = debit (expense), positive = credit (income)
  return {
    amount: Math.abs(num),
    type: num < 0 ? 'debit' : 'credit',
  };
}

export function rowsToRawTransactions(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): RawTransaction[] {
  return rows.map((row) => ({
    id: uuidv4(),
    source: 'csv_upload' as const,
    rawDate: row[mapping.date] ?? '',
    rawDescription: row[mapping.description] ?? '',
    rawAmount: row[mapping.amount] ?? '',
    rawCategory: mapping.category ? row[mapping.category] : undefined,
    accountName: mapping.account ? row[mapping.account] : undefined,
    metadata: row,
  }));
}

export function rawToTransaction(raw: RawTransaction): Transaction | null {
  try {
    const date = parseDate(raw.rawDate);
    const { amount, type } = parseAmount(raw.rawAmount);
    return {
      id: raw.id,
      date,
      description: raw.rawDescription.trim(),
      normalizedMerchant: raw.rawDescription.trim(), // updated by AI later
      amount,
      type,
      categoryId: raw.rawCategory ? 'other' : 'other', // AI will update
      accountId: raw.accountName ?? 'default',
      source: raw.source,
      tags: [],
      confidence: 0,
      isManualOverride: false,
    };
  } catch {
    return null;
  }
}

export function normalizeTransactions(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): Transaction[] {
  const raws = rowsToRawTransactions(rows, mapping);
  return raws.map(rawToTransaction).filter(Boolean) as Transaction[];
}

// Auto-detect column mapping from headers
export function detectColumnMapping(headers: string[]): Partial<ColumnMapping> {
  const lower = headers.map((h) => ({ original: h, lower: h.toLowerCase() }));
  const find = (keywords: string[]) =>
    lower.find((h) => keywords.some((k) => h.lower.includes(k)))?.original;

  return {
    date: find(['date', 'posted', 'transaction date', 'trans date']),
    description: find(['description', 'merchant', 'payee', 'name', 'memo', 'details']),
    amount: find(['amount', 'debit', 'credit', 'charge', 'payment']),
    category: find(['category', 'type', 'label']),
    account: find(['account', 'bank']),
  };
}
