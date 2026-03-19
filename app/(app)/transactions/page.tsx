'use client';

import { useState, useMemo, useRef } from 'react';
import { useAppData } from '@/context/AppDataContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { getCategoryColor, getCategoryIcon, getCategoryName, CATEGORIES } from '@/lib/categories';
import { Transaction } from '@/models/types';
import { format } from 'date-fns';
import { Search, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import Link from 'next/link';

const PAGE_SIZE = 50;

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

function CategoryPicker({ current, onSelect, onClose }: {
  current: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const groups = [
    { label: 'Income', cats: CATEGORIES.filter((c) => c.type === 'income') },
    { label: 'Essential', cats: CATEGORIES.filter((c) => c.type === 'essential') },
    { label: 'Discretionary', cats: CATEGORIES.filter((c) => c.type === 'discretionary') },
    { label: 'Savings & Transfers', cats: CATEGORIES.filter((c) => c.type === 'savings' || c.type === 'transfer') },
  ];

  return (
    <div className="absolute z-50 top-6 left-0 bg-[#13131f] border border-white/15 rounded-xl shadow-2xl p-2 w-52 max-h-72 overflow-y-auto">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="text-xs text-white/30 uppercase tracking-wider px-2 py-1 mt-1">{g.label}</p>
          {g.cats.map((c) => (
            <button
              key={c.id}
              onClick={() => { onSelect(c.id); onClose(); }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${c.id === current ? 'bg-violet-500/20 text-violet-300' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
            >
              <span>{c.icon}</span>
              <span className="flex-1 text-left truncate">{c.name}</span>
              {c.id === current && <Check className="w-3 h-3" />}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function TransactionsPage() {
  const { transactions, updateCategory, isLoading } = useAppData();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'debit' | 'credit'>('all');
  const [filterMonth, setFilterMonth] = useState('');
  const [page, setPage] = useState(0);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCat, setBulkCat] = useState(false);

  const months = useMemo(() => {
    const keys = new Set<string>();
    for (const t of transactions) {
      const d = new Date(t.date);
      keys.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return Array.from(keys).sort().reverse();
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterCategory && t.categoryId !== filterCategory) return false;
      if (filterMonth) {
        const d = new Date(t.date);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (k !== filterMonth) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!t.description.toLowerCase().includes(q) && !t.normalizedMerchant.toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, search, filterCategory, filterType, filterMonth]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === paged.length) setSelected(new Set());
    else setSelected(new Set(paged.map((t) => t.id)));
  };

  const applyBulkCategory = async (categoryId: string) => {
    await Promise.all(Array.from(selected).map((id) => updateCategory(id, categoryId)));
    setSelected(new Set());
    setBulkCat(false);
  };

  if (isLoading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState icon="💳" title="No transactions" description="Import a CSV to see your transactions here."
          action={<Link href="/" className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">Import CSV</Link>} />
      </div>
    );
  }

  return (
    <div className="p-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-white/40 text-sm mt-0.5">{filtered.length} of {transactions.length} transactions</p>
        </div>
        <Link href="/" className="text-sm text-violet-400 hover:text-violet-300 border border-violet-500/30 bg-violet-500/10 px-3 py-2 rounded-xl transition-all">
          + Import CSV
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search transactions..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-violet-400"
          />
        </div>

        <select value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); setPage(0); }}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-400">
          <option value="">All months</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(0); }}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-400">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>

        <div className="flex rounded-xl border border-white/10 overflow-hidden text-sm">
          {(['all', 'debit', 'credit'] as const).map((t) => (
            <button key={t} onClick={() => { setFilterType(t); setPage(0); }}
              className={`px-3 py-2 capitalize transition-colors ${filterType === t ? 'bg-violet-500/20 text-violet-300' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}>
              {t === 'all' ? 'All' : t === 'debit' ? 'Expenses' : 'Income'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="w-8 px-4 py-3">
                <input type="checkbox" checked={selected.size === paged.length && paged.length > 0}
                  onChange={toggleAll} className="accent-violet-500" />
              </th>
              <th className="text-left px-4 py-3 text-xs text-white/40 font-medium uppercase tracking-wider">Date</th>
              <th className="text-left px-4 py-3 text-xs text-white/40 font-medium uppercase tracking-wider">Merchant</th>
              <th className="text-left px-4 py-3 text-xs text-white/40 font-medium uppercase tracking-wider">Category</th>
              <th className="text-right px-4 py-3 text-xs text-white/40 font-medium uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((t) => (
              <tr key={t.id} className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors ${selected.has(t.id) ? 'bg-violet-500/5' : ''}`}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)} className="accent-violet-500" />
                </td>
                <td className="px-4 py-3 text-white/50 whitespace-nowrap">{format(new Date(t.date), 'MMM d, yyyy')}</td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-white/90">{t.normalizedMerchant || t.description}</p>
                    {t.normalizedMerchant && t.normalizedMerchant !== t.description && (
                      <p className="text-xs text-white/30">{t.description}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="relative inline-block">
                    <button
                      onClick={() => setEditingCatId(editingCatId === t.id ? null : t.id)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors text-xs"
                      style={{ color: getCategoryColor(t.categoryId) }}
                    >
                      <span>{getCategoryIcon(t.categoryId)}</span>
                      <span>{getCategoryName(t.categoryId)}</span>
                    </button>
                    {editingCatId === t.id && (
                      <CategoryPicker current={t.categoryId}
                        onSelect={(catId) => { updateCategory(t.id, catId); setEditingCatId(null); }}
                        onClose={() => setEditingCatId(null)} />
                    )}
                  </div>
                </td>
                <td className={`px-4 py-3 text-right font-semibold tabular-nums ${t.type === 'credit' ? 'text-emerald-400' : 'text-white'}`}>
                  {t.type === 'credit' ? '+' : '-'}{fmt(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-white/50">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#13131f] border border-violet-500/40 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-2xl z-40">
          <span className="text-sm text-white/70">{selected.size} selected</span>
          <div className="relative">
            <button onClick={() => setBulkCat((v) => !v)}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors">
              Re-categorize
            </button>
            {bulkCat && (
              <div className="absolute bottom-full mb-2 left-0">
                <CategoryPicker current=""
                  onSelect={applyBulkCategory}
                  onClose={() => setBulkCat(false)} />
              </div>
            )}
          </div>
          <button onClick={() => setSelected(new Set())} className="text-white/40 hover:text-white/80 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
