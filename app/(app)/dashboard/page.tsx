'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppData } from '@/context/AppDataContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { MonthPicker } from '@/components/ui/MonthPicker';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { getCategoryColor, getCategoryIcon, getCategoryName } from '@/lib/categories';
import { getAvailableMonthKeys, computeBudgetStatus, monthKey } from '@/lib/budgets';
import { getTopMerchants, getMonthlySpendingData } from '@/lib/analysis/aggregator';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import { PresentationIcon, TrendingUp, TrendingDown, Minus, ArrowRight, RefreshCw } from 'lucide-react';
import { RecurringFrequency } from '@/models/types';
import Link from 'next/link';
import { format } from 'date-fns';

function toMonthly(amount: number, freq: RecurringFrequency): number {
  switch (freq) {
    case 'weekly':    return amount * (52 / 12);
    case 'biweekly':  return amount * (26 / 12);
    case 'monthly':   return amount;
    case 'quarterly': return amount / 3;
    case 'annual':    return amount / 12;
  }
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const TOOLTIP_STYLE = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  color: '#1f2937',
  fontSize: '12px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

export default function DashboardPage() {
  const router = useRouter();
  const { transactions, budgets, accounts, accountBalances, recurringItems, latestReport, isLoading } = useAppData();

  const availableMonths = useMemo(() => getAvailableMonthKeys(transactions), [transactions]);
  const [selectedMonth, setSelectedMonth] = useState(() => availableMonths[0] ?? monthKey(new Date()));

  const monthTransactions = useMemo(() =>
    transactions.filter((t) => {
      if (!t.date) return false;
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return false;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return k === selectedMonth;
    }), [transactions, selectedMonth]);

  const income = useMemo(() =>
    monthTransactions.filter((t) => t.type === 'credit' && t.categoryId !== 'transfer').reduce((s, t) => s + t.amount, 0),
    [monthTransactions]);

  const expenses = useMemo(() =>
    monthTransactions.filter((t) => t.type === 'debit' && t.categoryId !== 'transfer').reduce((s, t) => s + t.amount, 0),
    [monthTransactions]);

  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

  const latestBalances = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of accountBalances) {
      if (!map[b.accountId] || new Date(b.date) > new Date(accountBalances.find(x => x.accountId === b.accountId && x.id !== b.id)?.date ?? 0)) {
        map[b.accountId] = b.balance;
      }
    }
    return map;
  }, [accountBalances]);

  const netWorth = useMemo(() => {
    let nw = 0;
    for (const acc of accounts) {
      const bal = latestBalances[acc.id] ?? 0;
      nw += acc.isAsset ? bal : -bal;
    }
    return nw;
  }, [accounts, latestBalances]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of monthTransactions) {
      if (t.type === 'debit' && t.categoryId !== 'transfer') {
        map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount;
      }
    }
    return Object.entries(map)
      .map(([id, val]) => ({ id, name: getCategoryName(id), value: Math.round(val), color: getCategoryColor(id) }))
      .sort((a, b) => b.value - a.value).slice(0, 8);
  }, [monthTransactions]);

  const monthlyData = useMemo(() => getMonthlySpendingData(transactions).slice(-6), [transactions]);

  const budgetStatuses = useMemo(() => {
    const monthBudgets = budgets.filter((b) => b.monthKey === selectedMonth);
    return monthBudgets
      .map((b) => computeBudgetStatus(b, transactions))
      .sort((a, b) => b.percentUsed - a.percentUsed)
      .slice(0, 5);
  }, [budgets, transactions, selectedMonth]);

  const recent = useMemo(() =>
    [...monthTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8),
    [monthTransactions]);

  const monthlyCommitted = useMemo(() => {
    const active = recurringItems.filter((r) => r.active);
    const total = active.reduce((s, r) => s + toMonthly(r.amount, r.frequency), 0);
    const pctOfIncome = income > 0 ? (total / income) * 100 : 0;
    const topItems = [...active]
      .sort((a, b) => toMonthly(b.amount, b.frequency) - toMonthly(a.amount, a.frequency))
      .slice(0, 5)
      .map((r) => ({ ...r, monthly: toMonthly(r.amount, r.frequency) }));
    return { total, pctOfIncome, topItems, count: active.length };
  }, [recurringItems, income]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return recurringItems
      .filter((r) => r.active && r.nextDueDate)
      .sort((a, b) => new Date(a.nextDueDate!).getTime() - new Date(b.nextDueDate!).getTime())
      .slice(0, 5)
      .map((r) => {
        const due = new Date(r.nextDueDate!);
        const daysAway = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { ...r, daysAway };
      });
  }, [recurringItems]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState
          icon="📊"
          title="No data yet"
          description="Import a CSV to get started with your financial dashboard."
          action={
            <Link href="/" className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors">
              Import CSV
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 text-gray-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{latestReport?.familyName ?? 'My'} Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">{transactions.length} transactions loaded</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <MonthPicker value={selectedMonth} onChange={setSelectedMonth} availableKeys={availableMonths} />
          <Link
            href="/presentation"
            className="flex items-center gap-2 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-xl px-3 py-2 text-sm transition-all whitespace-nowrap"
          >
            <PresentationIcon className="w-4 h-4" />
            <span className="hidden sm:inline">CFO Report</span>
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Net Worth', value: fmt(netWorth), color: netWorth >= 0 ? 'text-green-600' : 'text-red-500', sub: accounts.length > 0 ? `${accounts.length} accounts` : 'No accounts linked' },
          { label: 'Income', value: fmt(income), color: 'text-green-600', sub: selectedMonth },
          { label: 'Expenses', value: fmt(expenses), color: 'text-gray-900', sub: selectedMonth },
          { label: 'Savings Rate', value: `${savingsRate.toFixed(1)}%`, color: savingsRate >= 20 ? 'text-green-600' : savingsRate >= 10 ? 'text-amber-500' : 'text-red-500', sub: 'of income' },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-medium">{k.label}</p>
            <p className={`text-xl sm:text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Spending donut */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-gray-900">Spending by Category</h2>
            <Link href="/transactions" className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1">All <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {categoryData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No expense data this month</p>
          ) : (
            <div className="flex gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={categoryData} innerRadius="55%" outerRadius="80%" dataKey="value" paddingAngle={2}>
                    {categoryData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmt(Number(v)), '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5 overflow-hidden">
                {categoryData.slice(0, 6).map((c) => (
                  <div key={c.id} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                    <span className="text-gray-500 flex-1 truncate">{c.name}</span>
                    <span className="text-gray-700 font-medium tabular-nums">{fmt(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Budget overview */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-gray-900">Budget Overview</h2>
            <Link href="/budgets" className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1">Manage <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {budgetStatuses.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-400 text-sm">No budgets set for this month.</p>
              <Link href="/budgets" className="text-green-600 text-xs mt-2 inline-block hover:text-green-700">Set budgets →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {budgetStatuses.map((bs) => (
                <div key={bs.budget.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 flex items-center gap-1.5">
                      <span>{getCategoryIcon(bs.budget.categoryId)}</span>
                      {getCategoryName(bs.budget.categoryId)}
                    </span>
                    <span className={`text-xs font-medium tabular-nums ${bs.isOver ? 'text-red-500' : 'text-gray-500'}`}>
                      {fmt(bs.spent)} / {fmt(bs.budget.amount)}
                    </span>
                  </div>
                  <ProgressBar percent={bs.percentUsed} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Commitments */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-gray-900">Monthly Commitments</h2>
            <Link href="/recurring" className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1">
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {monthlyCommitted.count === 0 ? (
            <div className="text-center py-6">
              <RefreshCw className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No recurring items tracked.</p>
              <Link href="/review" className="text-green-600 text-xs mt-2 inline-block hover:text-green-700">
                Identify fixed expenses →
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{fmt(monthlyCommitted.total)}</p>
                  <p className="text-xs text-gray-400">/month committed · {monthlyCommitted.count} items</p>
                </div>
                <span className={`text-sm font-semibold px-2 py-1 rounded-lg ${
                  monthlyCommitted.pctOfIncome < 40 ? 'bg-green-100 text-green-700' :
                  monthlyCommitted.pctOfIncome < 60 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-600'
                }`}>
                  {monthlyCommitted.pctOfIncome.toFixed(0)}% of income
                </span>
              </div>
              <div className="space-y-1.5">
                {monthlyCommitted.topItems.map((r) => (
                  <div key={r.id} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getCategoryColor(r.categoryId) }} />
                    <span className="text-gray-500 flex-1 truncate">{r.normalizedMerchant}</span>
                    <span className="text-gray-700 font-medium tabular-nums">{fmt(r.monthly)}/mo</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Monthly cashflow */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
          <h2 className="font-semibold text-sm text-gray-900 mb-4">Monthly Cashflow</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: 'rgba(0,0,0,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [fmt(Number(v)), '']} />
              <Bar dataKey="income" name="Income" fill="#16a34a" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent transactions */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-gray-900">Recent Transactions</h2>
            <Link href="/transactions" className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-1">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-1.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                  style={{ background: getCategoryColor(t.categoryId) + '20' }}>
                  {getCategoryIcon(t.categoryId)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-800 truncate font-medium">{t.normalizedMerchant || t.description}</p>
                  <p className="text-xs text-gray-400">{t.date ? format(new Date(t.date), 'MMM d') : '—'}</p>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${t.type === 'credit' ? 'text-green-600' : 'text-gray-700'}`}>
                  {t.type === 'credit' ? '+' : '-'}{fmt(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming bills */}
      {upcoming.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-gray-900">Upcoming Bills</h2>
            <Link href="/recurring" className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1">Manage <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {upcoming.map((r) => (
              <div key={r.id} className={`flex-shrink-0 bg-gray-50 border rounded-xl p-3 w-36 ${r.daysAway <= 3 ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}>
                <p className="text-xs font-medium text-gray-800 truncate">{r.normalizedMerchant}</p>
                <p className="text-base font-bold text-gray-900 mt-1">{fmt(r.amount)}</p>
                <p className={`text-xs mt-1 ${r.daysAway <= 3 ? 'text-amber-600' : r.daysAway < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {r.daysAway < 0 ? `${Math.abs(r.daysAway)}d overdue` : r.daysAway === 0 ? 'Due today' : `in ${r.daysAway}d`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
