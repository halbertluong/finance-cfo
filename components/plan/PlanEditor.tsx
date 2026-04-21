'use client';

import { useState, ReactNode } from 'react';
import { v4 as uuid } from 'uuid';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { PaycheckModal } from './PaycheckModal';
import { ExpenseModal } from './ExpenseModal';
import { FinancialPlan, IncomeSource, PlannedExpense } from '@/models/types';
import { CATEGORIES } from '@/lib/categories';
import { monthlyEquivalent } from '@/lib/plan/computePlan';

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

interface SectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

interface ExpenseListProps {
  items: PlannedExpense[];
  onEdit: (item: PlannedExpense) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  allowIncome?: boolean;
}

function ExpenseList({ items, onEdit, onDelete, onAdd, allowIncome }: ExpenseListProps) {
  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <p className="text-sm text-gray-400 italic">No items yet.</p>
      )}
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm text-gray-500">{CATEGORIES.find((c) => c.id === item.categoryId)?.icon ?? '📦'}</span>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">{item.label}</div>
              <div className="text-xs text-gray-400">{item.frequency} · {fmt(monthlyEquivalent(item))}/mo equiv{item.isIncome ? ' (income)' : ''}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            <span className={`text-sm font-medium ${item.isIncome ? 'text-green-600' : 'text-gray-700'}`}>
              {item.isIncome ? '+' : '-'}{fmt(item.amount)}
            </span>
            <button onClick={() => onEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mt-1"
      >
        <Plus className="w-4 h-4" /> Add item
      </button>
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  plan: FinancialPlan | null;
  onSave: (plan: FinancialPlan) => Promise<void>;
}

export function PlanEditor({ open, onClose, plan, onSave }: Props) {
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>(plan?.incomeSources ?? []);
  const [fixedExpenses, setFixedExpenses] = useState<PlannedExpense[]>(plan?.fixedExpenses ?? []);
  const [semiExpenses, setSemiExpenses] = useState<PlannedExpense[]>(plan?.semiFrequentExpenses ?? []);
  const [rentalItems, setRentalItems] = useState<PlannedExpense[]>(plan?.rentalItems ?? []);
  const [variableCategoryIds, setVariableCategoryIds] = useState<string[]>(plan?.variableCategoryIds ?? []);
  const [planLabel, setPlanLabel] = useState(plan?.label ?? '2026 Family Plan');
  const [planYear, setPlanYear] = useState(plan?.year ?? new Date().getFullYear());

  const [paycheckModal, setPaycheckModal] = useState<{ open: boolean; item?: IncomeSource }>({ open: false });
  const [expenseModal, setExpenseModal] = useState<{
    open: boolean;
    item?: PlannedExpense;
    section: 'fixed' | 'semi' | 'rental';
  }>({ open: false, section: 'fixed' });

  const [saving, setSaving] = useState(false);

  // Sync state when plan prop changes
  useState(() => {
    if (plan) {
      setIncomeSources(plan.incomeSources);
      setFixedExpenses(plan.fixedExpenses);
      setSemiExpenses(plan.semiFrequentExpenses);
      setRentalItems(plan.rentalItems);
      setVariableCategoryIds(plan.variableCategoryIds);
      setPlanLabel(plan.label);
      setPlanYear(plan.year);
    }
  });

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        id: plan?.id ?? uuid(),
        label: planLabel,
        year: planYear,
        incomeSources,
        fixedExpenses,
        semiFrequentExpenses: semiExpenses,
        rentalItems,
        variableCategoryIds,
        createdAt: plan?.createdAt ?? new Date(),
        updatedAt: new Date(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function saveExpense(expense: PlannedExpense) {
    const section = expenseModal.section;
    const setter = section === 'fixed' ? setFixedExpenses : section === 'semi' ? setSemiExpenses : setRentalItems;
    setter((prev) => {
      const idx = prev.findIndex((e) => e.id === expense.id);
      return idx >= 0 ? prev.map((e) => e.id === expense.id ? expense : e) : [...prev, expense];
    });
  }

  function deleteExpense(id: string, section: 'fixed' | 'semi' | 'rental') {
    const setter = section === 'fixed' ? setFixedExpenses : section === 'semi' ? setSemiExpenses : setRentalItems;
    setter((prev) => prev.filter((e) => e.id !== id));
  }

  const expenseCats = CATEGORIES.filter((c) => c.type !== 'income' && c.type !== 'transfer');

  return (
    <>
      <Modal open={open} onClose={onClose} title="Edit Financial Plan" width="max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Plan Label</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={planLabel} onChange={(e) => setPlanLabel(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Year</label>
              <input
                type="number"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={planYear} onChange={(e) => setPlanYear(parseInt(e.target.value) || new Date().getFullYear())}
              />
            </div>
          </div>

          <Section title="💰 Income Sources">
            <div className="space-y-2">
              {incomeSources.map((src) => (
                <div key={src.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{src.name}</div>
                    <div className="text-xs text-gray-400">
                      {fmt(src.grossPerPaycheck)}/paycheck · days {src.payDaysOfMonth.join(', ')} ·{' '}
                      {src.deductions.length} deduction{src.deductions.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPaycheckModal({ open: true, item: src })} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setIncomeSources((p) => p.filter((s) => s.id !== src.id))} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setPaycheckModal({ open: true, item: undefined })}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 mt-1"
              >
                <Plus className="w-4 h-4" /> Add earner
              </button>
            </div>
          </Section>

          <Section title="📅 Fixed Monthly Expenses">
            <ExpenseList
              items={fixedExpenses}
              onEdit={(item) => setExpenseModal({ open: true, item, section: 'fixed' })}
              onDelete={(id) => deleteExpense(id, 'fixed')}
              onAdd={() => setExpenseModal({ open: true, item: undefined, section: 'fixed' })}
            />
          </Section>

          <Section title="🔁 Semi-Frequent Bills" defaultOpen={false}>
            <ExpenseList
              items={semiExpenses}
              onEdit={(item) => setExpenseModal({ open: true, item, section: 'semi' })}
              onDelete={(id) => deleteExpense(id, 'semi')}
              onAdd={() => setExpenseModal({ open: true, item: undefined, section: 'semi' })}
            />
          </Section>

          <Section title="🏠 Rental Property" defaultOpen={false}>
            <ExpenseList
              items={rentalItems}
              allowIncome
              onEdit={(item) => setExpenseModal({ open: true, item, section: 'rental' })}
              onDelete={(id) => deleteExpense(id, 'rental')}
              onAdd={() => setExpenseModal({ open: true, item: undefined, section: 'rental' })}
            />
          </Section>

          <Section title="📊 Variable Expense Categories" defaultOpen={false}>
            <p className="text-xs text-gray-500 mb-3">Select categories to track as variable expenses (actuals will come from your transactions).</p>
            <div className="flex flex-wrap gap-2">
              {expenseCats.map((c) => (
                <button
                  key={c.id}
                  onClick={() =>
                    setVariableCategoryIds((prev) =>
                      prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                    )
                  }
                  className={`px-3 py-1.5 text-xs rounded-full border transition-colors flex items-center gap-1.5 ${
                    variableCategoryIds.includes(c.id)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
          </Section>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Plan'}
            </button>
          </div>
        </div>
      </Modal>

      <PaycheckModal
        open={paycheckModal.open}
        onClose={() => setPaycheckModal({ open: false })}
        initial={paycheckModal.item}
        onSave={(src) => {
          setIncomeSources((prev) => {
            const idx = prev.findIndex((s) => s.id === src.id);
            return idx >= 0 ? prev.map((s) => s.id === src.id ? src : s) : [...prev, src];
          });
        }}
      />

      <ExpenseModal
        open={expenseModal.open}
        onClose={() => setExpenseModal((p) => ({ ...p, open: false }))}
        initial={expenseModal.item}
        allowIncome={expenseModal.section === 'rental'}
        onSave={saveExpense}
      />
    </>
  );
}
