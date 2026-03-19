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
import { PresentationIcon, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export default function DashboardPage() {
  const router = useRouter();
  const { transactions, budgets, accounts, accountBalances, recurringItems, latestReport, isLoading } = useAppData();

  const availableMonths = useMemo(() => getAvailableMonthKeys(transactions), [transactions]);
  const [selectedMonth, setSelectedMonth] = useState(() => availableMonths[0] ?? monthKey(new Date()));

  const monthTransactions = useMemo(() =>
    transactions.filter((t) => {
      const d = new Date(t.date);
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

  // Net worth from latest balances
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

  // Spending by category for donut
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

  // Monthly cashflow (last 6 months)
  const monthlyData = useMemo(() => getMonthlySpendingData(transactions).slice(-6), [transactions]);

  // Budget statuses
  const budgetStatuses = useMemo(() => {
    const monthBudgets = budgets.filter((b) => b.monthKey === selectedMonth);
    return monthBudgets
      .map((b) => computeBudgetStatus(b, transactions))
      .sort((a, b) => b.percentUsed - a.percentUsed)
      .slice(0, 5);
  }, [budgets, transactions, selectedMonth]);

  // Recent transactions
  const recent = useMemo(() =>
    [...monthTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8),
    [monthTransactions]);

  // Upcoming bills
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
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
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
            <Link href="/" className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">
              Import CSV
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{latestReport?.familyName ?? 'My'} Dashboard</h1>
          <p className="text-white/40 text-sm mt-0.5">{transactions.length} transactions loaded</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthPicker value={selectedMonth} onChange={setSelectedMonth} availableKeys={availableMonths} />
          <Link
            href="/presentation"
            className="flex items-center gap-2 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-300 rounded-xl px-3 py-2 text-sm transition-all"
          >
            <PresentationIcon className="w-4 h-4" />
            CFO Report
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Net Worth', value: fmt(netWorth), color: netWorth >= 0 ? 'text-emerald-400' : 'text-red-400', sub: accounts.length > 0 ? `${accounts.length} accounts` : 'No accounts linked' },
          { label: 'Income', value: fmt(income), color: 'text-emerald-400', sub: selectedMonth },
          { label: 'Expenses', value: fmt(expenses), color: 'text-white', sub: selectedMonth },
          { label: 'Savings Rate', value: `${savingsRate.toFixed(1)}%`, color: savingsRate >= 20 ? 'text-emerald-400' : savingsRate >= 10 ? 'text-amber-400' : 'text-red-400', sub: 'of income' },
        ].map((k) => (
          <div key={k.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-white/30 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending donut */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Spending by Category</h2>
            <Link href="/transactions" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">All <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {categoryData.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">No expense data this month</p>
          ) : (
            <div className="flex gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={categoryData} innerRadius="55%" outerRadius="80%" dataKey="value" paddingAngle={2}>
                    {categoryData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '12px' }}
                    formatter={(v) => [fmt(Number(v)), '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5 overflow-hidden">
                {categoryData.slice(0, 6).map((c) => (
                  <div key={c.id} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                    <span className="text-white/60 flex-1 truncate">{c.name}</span>
                    <span className="text-white/80 font-medium tabular-nums">{fmt(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Budget overview */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Budget Overview</h2>
            <Link href="/budgets" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">Manage <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {budgetStatuses.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-white/30 text-sm">No budgets set for this month.</p>
              <Link href="/budgets" className="text-violet-400 text-xs mt-2 inline-block hover:text-violet-300">Set budgets →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {budgetStatuses.map((bs) => (
                <div key={bs.budget.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/60 flex items-center gap-1.5">
                      <span>{getCategoryIcon(bs.budget.categoryId)}</span>
                      {getCategoryName(bs.budget.categoryId)}
                    </span>
                    <span className={`text-xs font-medium tabular-nums ${bs.isOver ? 'text-red-400' : 'text-white/60'}`}>
                      {fmt(bs.spent)} / {fmt(bs.budget.amount)}
                    </span>
                  </div>
                  <ProgressBar percent={bs.percentUsed} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly cashflow */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="font-semibold text-sm mb-4">Monthly Cashflow</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '12px' }}
                formatter={(v) => [fmt(Number(v)), '']} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent transactions */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Recent Transactions</h2>
            <Link href="/transactions" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-2">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-1.5">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                  style={{ background: getCategoryColor(t.categoryId) + '30' }}>
                  {getCategoryIcon(t.categoryId)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/80 truncate">{t.normalizedMerchant || t.description}</p>
                  <p className="text-xs text-white/30">{format(new Date(t.date), 'MMM d')}</p>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${t.type === 'credit' ? 'text-emerald-400' : 'text-white'}`}>
                  {t.type === 'credit' ? '+' : '-'}{fmt(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming bills */}
      {upcoming.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Upcoming Bills</h2>
            <Link href="/recurring" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">Manage <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {upcoming.map((r) => (
              <div key={r.id} className={`flex-shrink-0 bg-white/5 border rounded-xl p-3 w-36 ${r.daysAway <= 3 ? 'border-amber-500/40' : 'border-white/10'}`}>
                <p className="text-xs font-medium text-white truncate">{r.normalizedMerchant}</p>
                <p className="text-base font-bold text-white mt-1">{fmt(r.amount)}</p>
                <p className={`text-xs mt-1 ${r.daysAway <= 3 ? 'text-amber-400' : r.daysAway < 0 ? 'text-red-400' : 'text-white/40'}`}>
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
