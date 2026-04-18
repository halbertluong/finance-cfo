'use client';

import { useState, useMemo } from 'react';
import { useAppData } from '@/context/AppDataContext';
import { Modal } from '@/components/ui/Modal';
import { MonthPicker } from '@/components/ui/MonthPicker';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { getCategoryColor, getCategoryIcon, getCategoryName, CATEGORIES } from '@/lib/categories';
import { computeBudgetStatus, monthKey, getAvailableMonthKeys, prevMonthKey, formatMonthKey } from '@/lib/budgets';
import { Budget } from '@/models/types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

function BudgetModal({ budget, month, onSave, onClose }: {
  budget?: Budget;
  month: string;
  onSave: (b: Budget) => void;
  onClose: () => void;
}) {
  const [categoryId, setCategoryId] = useState(budget?.categoryId ?? '');
  const [amount, setAmount] = useState(String(budget?.amount ?? ''));
  const [rollover, setRollover] = useState(budget?.rollover ?? false);

  const handleSave = () => {
    if (!categoryId || !amount) return;
    onSave({
      id: budget?.id ?? uuidv4(),
      categoryId,
      monthKey: month,
      amount: parseFloat(amount),
      rollover,
      createdAt: budget?.createdAt ?? new Date(),
    });
  };

  const spendableCategories = CATEGORIES.filter((c) => c.type !== 'income' && c.type !== 'transfer');

  return (
    <div className="space-y-4">
      {!budget && (
        <div>
          <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-semibold">Category</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500">
            <option value="">Select a category</option>
            {spendableCategories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider font-semibold">Monthly Budget</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full bg-white border border-gray-300 rounded-xl pl-7 pr-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setRollover((v) => !v)}
          className={`relative w-10 h-6 rounded-full transition-colors ${rollover ? 'bg-green-600' : 'bg-gray-200'}`}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${rollover ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
        <div>
          <p className="text-sm text-gray-800">Roll over unused budget</p>
          <p className="text-xs text-gray-400">Unspent amount carries to next month</p>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={!categoryId || !amount}
          className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          {budget ? 'Update' : 'Create'} Budget
        </button>
      </div>
    </div>
  );
}

export default function BudgetsPage() {
  const { transactions, budgets, upsertBudget, removeBudget, isLoading } = useAppData();
  const availableMonths = useMemo(() => getAvailableMonthKeys(transactions), [transactions]);
  const [selectedMonth, setSelectedMonth] = useState(() => availableMonths[0] ?? monthKey(new Date()));
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | undefined>();

  const monthBudgets = useMemo(() => budgets.filter((b) => b.monthKey === selectedMonth), [budgets, selectedMonth]);
  const prevMonth = prevMonthKey(selectedMonth);
  const prevBudgets = useMemo(() => budgets.filter((b) => b.monthKey === prevMonth), [budgets, prevMonth]);

  const budgetStatuses = useMemo(() =>
    monthBudgets.map((b) => {
      const prev = prevBudgets.find((pb) => pb.categoryId === b.categoryId);
      return computeBudgetStatus(b, transactions, prev);
    }).sort((a, b) => b.percentUsed - a.percentUsed),
    [monthBudgets, prevBudgets, transactions]);

  const unbbudgetedCategories = useMemo(() => {
    const budgetedIds = new Set(monthBudgets.map((b) => b.categoryId));
    const spentIds = new Set(
      transactions.filter((t) => {
        if (t.type !== 'debit' || t.categoryId === 'transfer' || !t.date) return false;
        const d = new Date(t.date);
        if (isNaN(d.getTime())) return false;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
      }).map((t) => t.categoryId)
    );
    return Array.from(spentIds).filter((id) => !budgetedIds.has(id));
  }, [monthBudgets, transactions, selectedMonth]);

  const totalBudgeted = monthBudgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgetStatuses.reduce((s, bs) => s + bs.spent, 0);

  const copyFromPrevMonth = async () => {
    if (prevBudgets.length === 0) return;
    await Promise.all(prevBudgets.map((b) =>
      upsertBudget({ ...b, id: uuidv4(), monthKey: selectedMonth, createdAt: new Date() })
    ));
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 text-gray-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Budgets</h1>
          <p className="text-gray-400 text-sm mt-0.5">{formatMonthKey(selectedMonth)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          {monthBudgets.length === 0 && prevBudgets.length > 0 && (
            <button onClick={copyFromPrevMonth} className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 bg-white px-3 py-2 rounded-xl transition-colors">
              Copy from {formatMonthKey(prevMonth)}
            </button>
          )}
          <button onClick={() => { setEditing(undefined); setModalOpen(true); }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Add Budget
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {monthBudgets.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total Budgeted', value: fmt(totalBudgeted), color: 'text-gray-900' },
            { label: 'Total Spent', value: fmt(totalSpent), color: totalSpent > totalBudgeted ? 'text-red-500' : 'text-gray-900' },
            { label: 'Remaining', value: fmt(totalBudgeted - totalSpent), color: totalBudgeted - totalSpent < 0 ? 'text-red-500' : 'text-green-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-medium">{s.label}</p>
              <p className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Budget cards */}
      {budgetStatuses.length === 0 ? (
        <EmptyState icon="🎯" title="No budgets yet" description={`Set spending limits for ${formatMonthKey(selectedMonth)} to track your progress.`}
          action={<button onClick={() => setModalOpen(true)} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors">Create First Budget</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetStatuses.map((bs) => (
            <div key={bs.budget.id} className={`bg-white border rounded-2xl p-5 shadow-sm ${bs.isOver ? 'border-red-300' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getCategoryIcon(bs.budget.categoryId)}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{getCategoryName(bs.budget.categoryId)}</p>
                    {bs.rolloverAmount > 0 && (
                      <p className="text-xs text-green-600">+{fmt(bs.rolloverAmount)} rolled over</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(bs.budget); setModalOpen(true); }}
                    className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => removeBudget(bs.budget.id)}
                    className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <ProgressBar percent={bs.percentUsed} showLabel />
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-gray-400">{fmt(bs.spent)} spent</span>
                <span className={bs.isOver ? 'text-red-500 font-medium' : 'text-gray-400'}>
                  {bs.isOver ? `${fmt(Math.abs(bs.remaining))} over` : `${fmt(bs.remaining)} left`}
                </span>
              </div>
              <div className="text-xs text-gray-300 mt-0.5 text-right">of {fmt(bs.budget.amount)} budget</div>
            </div>
          ))}

          {unbbudgetedCategories.map((catId) => (
            <div key={catId} className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-center">
              <span className="text-2xl">{getCategoryIcon(catId)}</span>
              <p className="text-sm text-gray-500">{getCategoryName(catId)}</p>
              <p className="text-xs text-gray-400">spending detected, no budget set</p>
              <button onClick={() => { setEditing(undefined); setModalOpen(true); }}
                className="text-xs text-green-600 hover:text-green-700 mt-1">Set budget →</button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Budget' : 'Add Budget'}>
        <BudgetModal budget={editing} month={selectedMonth}
          onSave={async (b) => { await upsertBudget(b); setModalOpen(false); }}
          onClose={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
