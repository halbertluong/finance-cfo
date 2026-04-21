'use client';

import { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { Modal } from '@/components/ui/Modal';
import { PlannedExpense, PlanFrequency } from '@/models/types';
import { CATEGORIES } from '@/lib/categories';

const FREQUENCIES: { value: PlanFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'every2months', label: 'Every 2 months' },
  { value: 'every3months', label: 'Every 3 months' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semiannual', label: 'Semi-annual' },
  { value: 'annual', label: 'Annual' },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: PlannedExpense;
  onSave: (expense: PlannedExpense) => void;
  allowIncome?: boolean;
}

export function ExpenseModal({ open, onClose, initial, onSave, allowIncome }: Props) {
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<PlanFrequency>('monthly');
  const [dueDayOfMonth, setDueDayOfMonth] = useState('1');
  const [dueDayOfOccurrence, setDueDayOfOccurrence] = useState('1');
  const [occurrenceMonths, setOccurrenceMonths] = useState<number[]>([]);
  const [categoryId, setCategoryId] = useState(CATEGORIES[0]?.id ?? 'other');
  const [isIncome, setIsIncome] = useState(false);
  const [notes, setNotes] = useState('');
  const [creditCard, setCreditCard] = useState('');

  const isNonMonthly = !['weekly', 'monthly'].includes(frequency);

  useEffect(() => {
    if (initial) {
      setLabel(initial.label);
      setAmount(String(initial.amount));
      setFrequency(initial.frequency);
      setDueDayOfMonth(String(initial.dueDayOfMonth ?? 1));
      setDueDayOfOccurrence(String(initial.dueDayOfOccurrenceMonth ?? 1));
      setOccurrenceMonths(initial.occurrenceMonths ?? []);
      setCategoryId(initial.categoryId);
      setIsIncome(initial.isIncome ?? false);
      setNotes(initial.notes ?? '');
      setCreditCard(initial.creditCard ?? '');
    } else {
      setLabel('');
      setAmount('');
      setFrequency('monthly');
      setDueDayOfMonth('1');
      setDueDayOfOccurrence('1');
      setOccurrenceMonths([]);
      setCategoryId(CATEGORIES[0]?.id ?? 'other');
      setIsIncome(false);
      setNotes('');
      setCreditCard('');
    }
  }, [initial, open]);

  function toggleMonth(m: number) {
    setOccurrenceMonths((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort((a, b) => a - b)
    );
  }

  function handleSave() {
    onSave({
      id: initial?.id ?? uuid(),
      label: label.trim(),
      amount: parseFloat(amount) || 0,
      frequency,
      dueDayOfMonth: isNonMonthly ? undefined : parseInt(dueDayOfMonth) || 1,
      occurrenceMonths: isNonMonthly ? occurrenceMonths : undefined,
      dueDayOfOccurrenceMonth: isNonMonthly ? parseInt(dueDayOfOccurrence) || 1 : undefined,
      categoryId,
      isIncome,
      notes: notes.trim() || undefined,
      creditCard: creditCard.trim() || undefined,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Expense' : 'Add Expense'} width="max-w-lg">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-700 block mb-1">Description</label>
          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Mortgage - Our House"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Amount</label>
            <input
              type="number" step="0.01"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="3885.84"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Category</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            >
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Frequency</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={frequency} onChange={(e) => setFrequency(e.target.value as PlanFrequency)}
            >
              {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          {!isNonMonthly ? (
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Due Day of Month</label>
              <input
                type="number" min="1" max="31"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={dueDayOfMonth} onChange={(e) => setDueDayOfMonth(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Due Day (in occurrence month)</label>
              <input
                type="number" min="1" max="31"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={dueDayOfOccurrence} onChange={(e) => setDueDayOfOccurrence(e.target.value)}
              />
            </div>
          )}
        </div>

        {isNonMonthly && (
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Occurs In These Months</label>
            <div className="flex flex-wrap gap-1.5">
              {MONTHS.map((m, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleMonth(i + 1)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    occurrenceMonths.includes(i + 1)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Credit Card (optional)</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={creditCard} onChange={(e) => setCreditCard(e.target.value)} placeholder="AmEx"
            />
          </div>
          {allowIncome && (
            <div className="flex items-center gap-2 pt-5">
              <input
                id="isIncome" type="checkbox" checked={isIncome}
                onChange={(e) => setIsIncome(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="isIncome" className="text-sm text-gray-700">This is income (positive cash flow)</label>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!label || !amount}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
