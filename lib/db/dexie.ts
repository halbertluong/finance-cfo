'use client';

import Dexie, { type Table } from 'dexie';
import { Transaction, NetWorthSnapshot, AnalysisReport } from '@/models/types';

export class FinanceDB extends Dexie {
  transactions!: Table<Transaction & { _date: number }, string>;
  netWorthSnapshots!: Table<NetWorthSnapshot & { _date: number }, string>;
  reports!: Table<AnalysisReport & { _generatedAt: number }, string>;

  constructor() {
    super('FinanceCFO');
    this.version(1).stores({
      transactions: 'id, categoryId, type, accountId, _date',
      netWorthSnapshots: 'id, _date',
      reports: 'id, _generatedAt',
    });
  }
}

let _db: FinanceDB | null = null;

export function getDB(): FinanceDB {
  if (!_db) _db = new FinanceDB();
  return _db;
}

// Dexie can't index Date objects — serialize/deserialize on the way in/out
export async function saveTransactions(transactions: Transaction[]): Promise<void> {
  const db = getDB();
  await db.transactions.bulkPut(
    transactions.map((t) => ({ ...t, _date: t.date.getTime() }))
  );
}

export async function loadTransactions(): Promise<Transaction[]> {
  const db = getDB();
  const rows = await db.transactions.toArray();
  return rows.map(({ _date, ...t }) => ({ ...t, date: new Date(_date) }));
}

export async function clearTransactions(): Promise<void> {
  await getDB().transactions.clear();
}

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
  } as AnalysisReport;
}
