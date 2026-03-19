'use client';

import { useState, useMemo } from 'react';
import { useAppData } from '@/context/AppDataContext';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { RecurringTransaction } from '@/models/types';
import { detectRecurringTransactions } from '@/lib/analysis/recurring';
import { getCategoryIcon, getCategoryName, CATEGORIES } from '@/lib/categories';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Check, X, RefreshCw, Trash2, Power } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

const FREQ_LABELS: Record<string, string> = {
  weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly',
  quarterly: 'Quarterly', annual: 'Annual',
};

function AddRecurringModal({ onSave, onClose }: { onSave: (r: RecurringTransaction) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('subscriptions');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<RecurringTransaction['frequency']>('monthly');
  const [nextDue, setNextDue] = useState('');

  const handleSave = () => {
    if (!name || !amount) return;
    onSave({
      id: uuidv4(), merchantName: name, normalizedMerchant: name,
      categoryId, amount: parseFloat(amount), frequency,
      nextDueDate: nextDue ? new Date(nextDue) : undefined,
      active: true, isManuallyAdded: true, autoDetected: false,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-white/60 mb-1.5 uppercase tracking-wider">Merchant / Bill Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Netflix"
          className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-400" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/60 mb-1.5 uppercase tracking-wider">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-7 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-400" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-1.5 uppercase tracking-wider">Frequency</label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value as RecurringTransaction['frequency'])}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-400">
            {Object.entries(FREQ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-white/60 mb-1.5 uppercase tracking-wider">Category</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-400">
          {CATEGORIES.filter((c) => c.type !== 'income' && c.type !== 'transfer').map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-white/60 mb-1.5 uppercase tracking-wider">Next Due Date (optional)</label>
        <input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-400" />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/60 text-sm hover:bg-white/5 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={!name || !amount}
          className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold disabled:opacity-40 transition-colors">
          Add Bill
        </button>
      </div>
    </div>
  );
}

export default function RecurringPage() {
  const { transactions, recurringItems, upsertRecurring, removeRecurring, isLoading } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);

  const suggestions = useMemo(() => {
    const existingNames = new Set(recurringItems.map((r) => r.normalizedMerchant));
    return detectRecurringTransactions(transactions, existingNames);
  }, [transactions, recurringItems]);

  const active = recurringItems.filter((r) => r.active);
  const inactive = recurringItems.filter((r) => !r.active);

  const totalMonthly = active.reduce((s, r) => {
    const multiplier = r.frequency === 'weekly' ? 4.33 : r.frequency === 'biweekly' ? 2.17 :
      r.frequency === 'monthly' ? 1 : r.frequency === 'quarterly' ? 1 / 3 : 1 / 12;
    return s + r.amount * multiplier;
  }, 0);

  const getDaysStatus = (r: RecurringTransaction) => {
    if (!r.nextDueDate) return null;
    return differenceInDays(new Date(r.nextDueDate), new Date());
  };

  if (isLoading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Recurring & Bills</h1>
          {active.length > 0 && (
            <p className="text-white/40 text-sm mt-0.5">~{fmt(totalMonthly)}/month across {active.length} active bills</p>
          )}
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Add Bill
        </button>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-amber-400">Detected Recurring ({suggestions.length})</h2>
          </div>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                <span>{getCategoryIcon(s.categoryId)}</span>
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">{s.normalizedMerchant}</p>
                  <p className="text-xs text-white/40">{FREQ_LABELS[s.frequency]} · ~{fmt(s.amount)}</p>
                </div>
                <button onClick={() => upsertRecurring(s)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-lg text-xs transition-colors">
                  <Check className="w-3 h-3" /> Confirm
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active bills */}
      {active.length === 0 && suggestions.length === 0 ? (
        <EmptyState icon="🔄" title="No recurring bills tracked" description="Add your subscriptions and bills to track upcoming due dates and monthly costs."
          action={<button onClick={() => setModalOpen(true)} className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">Add First Bill</button>} />
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10">
            <h2 className="text-sm font-semibold">Active Bills & Subscriptions</h2>
          </div>
          {active.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">No active bills. Add one above.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-2.5 text-xs text-white/40 font-medium uppercase tracking-wider">Bill</th>
                  <th className="text-left px-5 py-2.5 text-xs text-white/40 font-medium uppercase tracking-wider">Frequency</th>
                  <th className="text-right px-5 py-2.5 text-xs text-white/40 font-medium uppercase tracking-wider">Amount</th>
                  <th className="text-right px-5 py-2.5 text-xs text-white/40 font-medium uppercase tracking-wider">Next Due</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {active.map((r) => {
                  const daysAway = getDaysStatus(r);
                  return (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span>{getCategoryIcon(r.categoryId)}</span>
                          <div>
                            <p className="text-white/90">{r.normalizedMerchant}</p>
                            <p className="text-xs text-white/30">{getCategoryName(r.categoryId)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-white/50">{FREQ_LABELS[r.frequency]}</td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums">{fmt(r.amount)}</td>
                      <td className="px-5 py-3 text-right">
                        {daysAway !== null ? (
                          <span className={`text-xs font-medium ${daysAway < 0 ? 'text-red-400' : daysAway <= 3 ? 'text-amber-400' : 'text-white/50'}`}>
                            {daysAway < 0 ? `${Math.abs(daysAway)}d overdue` : daysAway === 0 ? 'Today' : `in ${daysAway}d`}
                          </span>
                        ) : <span className="text-white/20 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => upsertRecurring({ ...r, active: false })}
                            className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-amber-400 rounded-lg transition-colors" title="Deactivate">
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => removeRecurring(r.id)}
                            className="w-7 h-7 flex items-center justify-center text-white/30 hover:text-red-400 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {inactive.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Inactive</p>
          <div className="space-y-1">
            {inactive.map((r) => (
              <div key={r.id} className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 opacity-50">
                <span className="text-sm">{getCategoryIcon(r.categoryId)}</span>
                <span className="text-sm text-white/60 flex-1">{r.normalizedMerchant}</span>
                <span className="text-xs text-white/30">{fmt(r.amount)}</span>
                <button onClick={() => upsertRecurring({ ...r, active: true })} className="text-xs text-violet-400 hover:text-violet-300">Reactivate</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Bill or Subscription">
        <AddRecurringModal
          onSave={async (r) => { await upsertRecurring(r); setModalOpen(false); }}
          onClose={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
