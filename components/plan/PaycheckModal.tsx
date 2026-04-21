'use client';

import { useState, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { IncomeSource, PaycheckDeduction } from '@/models/types';
import { CATEGORIES } from '@/lib/categories';

const incomeCats = CATEGORIES.filter((c) => c.type === 'income');

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: IncomeSource;
  onSave: (source: IncomeSource) => void;
}

const DEDUCTION_TYPES: PaycheckDeduction['type'][] = ['tax', '401k', 'insurance', 'espp', 'other'];

function emptyDeduction(): PaycheckDeduction {
  return { id: uuid(), label: '', amount: 0, type: 'tax' };
}

export function PaycheckModal({ open, onClose, initial, onSave }: Props) {
  const [name, setName] = useState('');
  const [gross, setGross] = useState('');
  const [payDays, setPayDays] = useState('6, 21');
  const [categoryId, setCategoryId] = useState(incomeCats[0]?.id ?? 'income');
  const [deductions, setDeductions] = useState<PaycheckDeduction[]>([emptyDeduction()]);

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setGross(String(initial.grossPerPaycheck));
      setPayDays(initial.payDaysOfMonth.join(', '));
      setCategoryId(initial.categoryId);
      setDeductions(initial.deductions.length ? initial.deductions : [emptyDeduction()]);
    } else {
      setName('');
      setGross('');
      setPayDays('6, 21');
      setCategoryId(incomeCats[0]?.id ?? 'income');
      setDeductions([emptyDeduction()]);
    }
  }, [initial, open]);

  function handleSave() {
    const parsedDays = payDays.split(',').map((s) => parseInt(s.trim())).filter(Boolean);
    const validDeductions = deductions.filter((d) => d.label && d.amount > 0);
    onSave({
      id: initial?.id ?? uuid(),
      name: name.trim(),
      grossPerPaycheck: parseFloat(gross) || 0,
      paychecksPerYear: parsedDays.length * 12,
      payDaysOfMonth: parsedDays,
      deductions: validDeductions,
      categoryId,
    });
    onClose();
  }

  function updateDeduction(id: string, field: keyof PaycheckDeduction, value: string | number) {
    setDeductions((prev) => prev.map((d) => d.id === id ? { ...d, [field]: value } : d));
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Income Source' : 'Add Income Source'} width="max-w-xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Earner Name</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name} onChange={(e) => setName(e.target.value)} placeholder="Mackenzie"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Gross Per Paycheck</label>
            <input
              type="number" step="0.01"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={gross} onChange={(e) => setGross(e.target.value)} placeholder="15312.50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Pay Days of Month (comma-sep)</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={payDays} onChange={(e) => setPayDays(e.target.value)} placeholder="6, 21"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Income Category</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
            >
              {incomeCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-700">Payroll Deductions</label>
            <button
              onClick={() => setDeductions((d) => [...d, emptyDeduction()])}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Row
            </button>
          </div>
          <div className="space-y-2">
            {deductions.map((d) => (
              <div key={d.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                <input
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={d.label} onChange={(e) => updateDeduction(d.id, 'label', e.target.value)}
                  placeholder="Fed W/H"
                />
                <select
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={d.type} onChange={(e) => updateDeduction(d.id, 'type', e.target.value)}
                >
                  {DEDUCTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                  type="number" step="0.01"
                  className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={d.amount || ''} onChange={(e) => updateDeduction(d.id, 'amount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
                <button
                  onClick={() => setDeductions((prev) => prev.filter((x) => x.id !== d.id))}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!name || !gross}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
