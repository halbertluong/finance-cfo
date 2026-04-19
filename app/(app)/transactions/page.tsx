'use client';

import { useState, useMemo } from 'react';
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
    <div className="absolute z-50 top-6 left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-2 w-52 max-h-72 overflow-y-auto">
      {groups.map((g) => (
        <div key={g.label}>
          <p className="text-xs text-gray-400 uppercase tracking-wider px-2 py-1 mt-1 font-medium">{g.label}</p>
          {g.cats.map((c) => (
            <button
              key={c.id}
              onClick={() => { onSelect(c.id); onClose(); }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${c.id === current ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
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
      if (!t.date) continue;
      const d = new Date(t.date);
      if (isNaN(d.getTime())) continue;
      keys.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return Array.from(keys).sort().reverse();
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterCategory && t.categoryId !== filterCategory) return false;
      if (filterMonth) {
        if (!t.date) return false;
        const d = new Date(t.date);
        if (isNaN(d.getTime())) return false;
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

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState icon="💳" title="No transactions" description="Import a CSV to see your transactions here."
          action={<Link href="/?import=true" className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors">Import CSV</Link>} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 text-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-400 text-sm mt-0.5">{filtered.length} of {transactions.length} transactions</p>
        </div>
        <Link href="/?import=true" className="text-sm text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-xl transition-all">
          + Import
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-5">
        <div className="relative flex-1 min-w-44">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search transactions..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          />
        </div>

        <select value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); setPage(0); }}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-green-500">
          <option value="">All months</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(0); }}
          className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-green-500">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>

        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm bg-white">
          {(['all', 'debit', 'credit'] as const).map((t) => (
            <button key={t} onClick={() => { setFilterType(t); setPage(0); }}
              className={`px-3 py-2 capitalize transition-colors ${filterType === t ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}>
              {t === 'all' ? 'All' : t === 'debit' ? 'Expenses' : 'Income'}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="w-8 px-4 py-3">
                <input type="checkbox" checked={selected.size === paged.length && paged.length > 0}
                  onChange={toggleAll} className="accent-green-600" />
              </th>
              <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Date</th>
              <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Merchant</th>
              <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Category</th>
              <th className="text-right px-4 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((t) => (
              <tr key={t.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected.has(t.id) ? 'bg-green-50' : ''}`}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)} className="accent-green-600" />
                </td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{format(new Date(t.date), 'MMM d, yyyy')}</td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-gray-800 font-medium">{t.normalizedMerchant || t.description}</p>
                    {t.normalizedMerchant && t.normalizedMerchant !== t.description && (
                      <p className="text-xs text-gray-400">{t.description}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="relative inline-block">
                    <button
                      onClick={() => setEditingCatId(editingCatId === t.id ? null : t.id)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors text-xs"
                      style={{ color: getCategoryColor(t.categoryId) }}
                    >
                      <span>{getCategoryIcon(t.categoryId)}</span>
                      <span className="font-medium">{getCategoryName(t.categoryId)}</span>
                    </button>
                    {editingCatId === t.id && (
                      <CategoryPicker current={t.categoryId}
                        onSelect={(catId) => { updateCategory(t.id, catId); setEditingCatId(null); }}
                        onClose={() => setEditingCatId(null)} />
                    )}
                  </div>
                </td>
                <td className={`px-4 py-3 text-right font-semibold tabular-nums ${t.type === 'credit' ? 'text-green-600' : 'text-gray-800'}`}>
                  {t.type === 'credit' ? '+' : '-'}{fmt(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-2">
        {paged.map((t) => (
          <div key={t.id} className={`bg-white border rounded-xl px-4 py-3 shadow-sm ${selected.has(t.id) ? 'border-green-300 bg-green-50' : 'border-gray-100'}`}
            onClick={() => toggleSelect(t.id)}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: getCategoryColor(t.categoryId) + '20' }}>
                {getCategoryIcon(t.categoryId)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{t.normalizedMerchant || t.description}</p>
                <p className="text-xs text-gray-400">{format(new Date(t.date), 'MMM d')} · {getCategoryName(t.categoryId)}</p>
              </div>
              <span className={`text-sm font-bold tabular-nums ${t.type === 'credit' ? 'text-green-600' : 'text-gray-800'}`}>
                {t.type === 'credit' ? '+' : '-'}{fmt(t.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-gray-600">
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-gray-600">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-xl z-40">
          <span className="text-sm text-gray-600">{selected.size} selected</span>
          <div className="relative">
            <button onClick={() => setBulkCat((v) => !v)}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors">
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
          <button onClick={() => setSelected(new Set())} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
