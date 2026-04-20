'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAppData } from '@/context/AppDataContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { CATEGORIES, getCategoryColor, getCategoryIcon } from '@/lib/categories';
import { detectRecurringTransactions, getNextDueDate } from '@/lib/analysis/recurring';
import { Transaction, RecurringTransaction, RecurringFrequency } from '@/models/types';
import { MerchantReviewResult } from '@/lib/ai/prompts';
import { bulkUpdateTransactionGroup } from '@/lib/db/api-client';
import { v4 as uuidv4 } from 'uuid';
import {
  Wand2, Search, Check, AlertTriangle, ChevronDown, RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

interface MerchantGroup {
  key: string;
  displayName: string;
  transactions: Transaction[];
  count: number;
  totalAmount: number;
  avgAmount: number;
  firstSeen: Date;
  lastSeen: Date;
  dominantCategoryId: string;
  mixedCategories: boolean;
}

interface RowState {
  categoryId: string;
  groupId: string | null;
  isRecurring: boolean;
  frequency: RecurringFrequency;
  applied: boolean;
  applying: boolean;
  error: string | null;
}

type AISuggestion = {
  categoryId: string;
  isRecurring: boolean;
  merchantType: 'subscription' | 'utility_bill' | 'irregular_bill' | 'variable_spend';
  suggestedFrequency?: RecurringFrequency | null;
  confidence: number;
};

type FilterTab = 'all' | 'recurring' | 'bills' | 'uncategorized';

const MERCHANT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  subscription: { label: 'Subscription', color: 'bg-violet-100 text-violet-700' },
  utility_bill: { label: 'Utility Bill', color: 'bg-blue-100 text-blue-700' },
  irregular_bill: { label: 'Irregular Bill', color: 'bg-indigo-100 text-indigo-700' },
  variable_spend: { label: 'Variable', color: 'bg-gray-100 text-gray-500' },
};

const SELECTABLE_CATEGORIES = CATEGORIES.filter(
  (c) => c.type !== 'income' && c.id !== 'transfer'
);

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const fmtSmall = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);

function dateRangeLabel(first: Date, last: Date): string {
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  if (first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear()) {
    return fmt(first);
  }
  return `${fmt(first)} – ${fmt(last)}`;
}

export default function ReviewPage() {
  const { transactions, recurringItems, groups, updateCategory, upsertRecurring, isLoading } = useAppData();

  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, AISuggestion>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiRan, setAiRan] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const merchantGroups = useMemo((): MerchantGroup[] => {
    const debits = transactions.filter(
      (t) => t.type === 'debit' && t.categoryId !== 'transfer'
    );
    const map = new Map<string, Transaction[]>();
    for (const t of debits) {
      const key = t.normalizedMerchant || t.description;
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return Array.from(map.entries())
      .map(([key, txs]): MerchantGroup => {
        const total = txs.reduce((s, t) => s + t.amount, 0);
        const timestamps = txs.map((t) => new Date(t.date).getTime());
        const catCounts = new Map<string, number>();
        for (const t of txs) catCounts.set(t.categoryId, (catCounts.get(t.categoryId) ?? 0) + 1);
        const dominant = [...catCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
        return {
          key,
          displayName: key,
          transactions: txs,
          count: txs.length,
          totalAmount: total,
          avgAmount: total / txs.length,
          firstSeen: new Date(Math.min(...timestamps)),
          lastSeen: new Date(Math.max(...timestamps)),
          dominantCategoryId: dominant,
          mixedCategories: catCounts.size > 1,
        };
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [transactions]);

  const detectedRecurring = useMemo(() => {
    const existingNames = new Set(recurringItems.map((r) => r.normalizedMerchant));
    return detectRecurringTransactions(transactions, existingNames);
  }, [transactions, recurringItems]);

  // Initialize row states when merchant groups load
  useEffect(() => {
    if (merchantGroups.length === 0) return;
    setRowStates((prev) => {
      const next = { ...prev };
      for (const g of merchantGroups) {
        if (!next[g.key]) {
          // Preserve existing groupId if transactions are already tagged
          const existingGroupId = g.transactions.find((t) => t.groupId)?.groupId ?? null;
          next[g.key] = {
            categoryId: g.dominantCategoryId,
            groupId: existingGroupId,
            isRecurring: false,
            frequency: 'monthly',
            applied: false,
            applying: false,
            error: null,
          };
        }
      }
      return next;
    });
  }, [merchantGroups]);

  // Merge detected recurring into row states
  useEffect(() => {
    if (detectedRecurring.length === 0) return;
    setRowStates((prev) => {
      const next = { ...prev };
      for (const rec of detectedRecurring) {
        const key = rec.normalizedMerchant;
        if (next[key] && !next[key].applied) {
          next[key] = { ...next[key], isRecurring: true, frequency: rec.frequency };
        }
      }
      return next;
    });
  }, [detectedRecurring]);

  const filteredGroups = useMemo(() => {
    let groups = merchantGroups;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      groups = groups.filter((g) => g.displayName.toLowerCase().includes(q));
    }
    switch (filterTab) {
      case 'recurring':
        groups = groups.filter((g) => rowStates[g.key]?.isRecurring);
        break;
      case 'bills':
        groups = groups.filter((g) => {
          const s = aiSuggestions[g.key];
          return s?.merchantType === 'utility_bill' || s?.merchantType === 'irregular_bill';
        });
        break;
      case 'uncategorized':
        groups = groups.filter(
          (g) => g.dominantCategoryId === 'other' || !g.dominantCategoryId
        );
        break;
    }
    return groups;
  }, [merchantGroups, searchQuery, filterTab, rowStates, aiSuggestions]);

  const summaryStats = useMemo(() => ({
    total: merchantGroups.length,
    likelyRecurring: Object.values(rowStates).filter((s) => s.isRecurring).length,
    applied: Object.values(rowStates).filter((s) => s.applied).length,
  }), [merchantGroups, rowStates]);

  const tabCounts = useMemo(() => ({
    all: merchantGroups.length,
    recurring: merchantGroups.filter((g) => rowStates[g.key]?.isRecurring).length,
    bills: merchantGroups.filter((g) => {
      const s = aiSuggestions[g.key];
      return s?.merchantType === 'utility_bill' || s?.merchantType === 'irregular_bill';
    }).length,
    uncategorized: merchantGroups.filter(
      (g) => g.dominantCategoryId === 'other' || !g.dominantCategoryId
    ).length,
  }), [merchantGroups, rowStates, aiSuggestions]);

  async function handleAnalyzeWithAI() {
    setAiLoading(true);
    setAiError(null);
    try {
      const payload = merchantGroups.map((g) => ({
        name: g.key,
        samples: [...new Set(g.transactions.map((t) => t.description))].slice(0, 3),
        avgAmount: g.avgAmount,
        count: g.count,
        firstSeen: g.firstSeen.toISOString(),
        lastSeen: g.lastSeen.toISOString(),
        currentCategoryId: rowStates[g.key]?.categoryId ?? g.dominantCategoryId,
      }));

      const res = await fetch('/api/merchant-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchants: payload }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Request failed: ${res.status}`);
      }

      const { results }: { results: MerchantReviewResult[] } = await res.json();

      const resultMap: Record<string, AISuggestion> = {};
      for (const r of results) {
        resultMap[r.name] = {
          categoryId: r.categoryId,
          isRecurring: r.isRecurring,
          merchantType: r.merchantType,
          suggestedFrequency: r.suggestedFrequency ?? null,
          confidence: r.confidence,
        };
      }

      setAiSuggestions(resultMap);
      setAiRan(true);

      setRowStates((prev) => {
        const next = { ...prev };
        for (const [name, suggestion] of Object.entries(resultMap)) {
          if (next[name] && !next[name].applied) {
            next[name] = {
              ...next[name],
              categoryId: suggestion.categoryId,
              isRecurring: suggestion.isRecurring,
              frequency: suggestion.suggestedFrequency ?? next[name].frequency,
            };
          }
        }
        return next;
      });
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'AI analysis failed');
    } finally {
      setAiLoading(false);
    }
  }

  function updateRow(key: string, patch: Partial<RowState>) {
    setRowStates((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  async function handleApplyRow(merchantKey: string) {
    const group = merchantGroups.find((g) => g.key === merchantKey);
    const state = rowStates[merchantKey];
    if (!group || !state) return;

    updateRow(merchantKey, { applying: true, error: null });

    try {
      await Promise.all(
        group.transactions.map((t) => updateCategory(t.id, state.categoryId))
      );

      // Update group tag in bulk (single DB call)
      await bulkUpdateTransactionGroup(
        group.transactions.map((t) => t.id),
        state.groupId
      );

      if (state.isRecurring) {
        const existing = recurringItems.find((r) => r.normalizedMerchant === merchantKey);
        const record: RecurringTransaction = existing
          ? {
              ...existing,
              categoryId: state.categoryId,
              frequency: state.frequency,
              amount: Math.round(group.avgAmount * 100) / 100,
              lastSeenDate: group.lastSeen,
              nextDueDate: getNextDueDate(group.lastSeen, state.frequency),
              active: true,
            }
          : {
              id: uuidv4(),
              merchantName: group.displayName,
              normalizedMerchant: merchantKey,
              categoryId: state.categoryId,
              amount: Math.round(group.avgAmount * 100) / 100,
              frequency: state.frequency,
              nextDueDate: getNextDueDate(group.lastSeen, state.frequency),
              lastSeenDate: group.lastSeen,
              active: true,
              isManuallyAdded: false,
              autoDetected: true,
            };
        await upsertRecurring(record);
      }

      updateRow(merchantKey, { applying: false, applied: true });
    } catch (e) {
      updateRow(merchantKey, {
        applying: false,
        error: e instanceof Error ? e.message : 'Failed to apply',
      });
    }
  }

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
          icon="🧾"
          title="No transactions to review"
          description="Import a CSV to get started with Smart Review."
          action={
            <Link href="/?import=true" className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors">
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-green-600" />
            Smart Review
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {summaryStats.total} merchants · {summaryStats.likelyRecurring} likely recurring · {summaryStats.applied} applied
          </p>
        </div>
      </div>

      {/* AI Analysis box */}
      <div className={`rounded-2xl p-4 sm:p-5 border ${aiRan ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            {aiRan ? (
              <>
                <p className="font-semibold text-green-800 text-sm">AI analysis complete</p>
                <p className="text-green-700 text-xs mt-0.5">
                  Suggestions applied to {Object.keys(aiSuggestions).length} merchants. Review and click Apply on each row.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-amber-800 text-sm">Analyze your merchants with AI</p>
                <p className="text-amber-700 text-xs mt-0.5">
                  Claude will identify subscriptions, utility bills, and suggest categories for all {summaryStats.total} merchants.
                  Recurring items are already pre-detected from date patterns.
                </p>
              </>
            )}
          </div>
          <button
            onClick={handleAnalyzeWithAI}
            disabled={aiLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
          >
            {aiLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing {merchantGroups.length} merchants...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                {aiRan ? 'Re-analyze' : 'Analyze with AI'}
              </>
            )}
          </button>
        </div>
        {aiError && <p className="text-sm text-red-600 mt-2">{aiError}</p>}
      </div>

      {/* Search + Filter tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search merchants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['all', 'recurring', 'bills', 'uncategorized'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'all' ? 'All' : tab === 'recurring' ? 'Likely Recurring' : tab === 'bills' ? 'Bills' : 'Uncategorized'}
              <span className="ml-1 text-gray-400">({tabCounts[tab]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Merchant list */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm">No merchants match this filter.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredGroups.map((g) => {
            const state = rowStates[g.key];
            const suggestion = aiSuggestions[g.key];
            if (!state) return null;

            return (
              <MerchantRow
                key={g.key}
                group={g}
                state={state}
                suggestion={suggestion}
                groups={groups}
                onUpdateState={(patch) => updateRow(g.key, patch)}
                onApply={() => handleApplyRow(g.key)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function MerchantRow({
  group,
  state,
  suggestion,
  groups,
  onUpdateState,
  onApply,
}: {
  group: MerchantGroup;
  state: RowState;
  suggestion?: AISuggestion;
  groups: import('@/models/types').FinancialGroup[];
  onUpdateState: (patch: Partial<RowState>) => void;
  onApply: () => void;
}) {
  const categoryColor = getCategoryColor(state.categoryId);
  const categoryIcon = getCategoryIcon(state.categoryId);

  return (
    <div
      className={`bg-white border border-gray-100 rounded-2xl p-4 shadow-sm transition-opacity ${
        state.applied ? 'opacity-60' : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        {/* Left: merchant info */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 mt-0.5"
            style={{ background: categoryColor + '20' }}
          >
            {categoryIcon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-gray-900 truncate">{group.displayName}</span>
              <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{group.count}×</span>
              {group.mixedCategories && (
                <span title="Transactions have mixed categories — applying will normalize all to selected">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                </span>
              )}
              {suggestion && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MERCHANT_TYPE_LABELS[suggestion.merchantType].color}`}>
                  {MERCHANT_TYPE_LABELS[suggestion.merchantType].label}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {dateRangeLabel(group.firstSeen, group.lastSeen)} · avg {fmtSmall(group.avgAmount)}/tx · {fmt(group.totalAmount)} total
            </p>
          </div>
        </div>

        {/* Right: controls + apply */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto">
          {/* Category select */}
          <div className="relative">
            <select
              value={state.categoryId}
              onChange={(e) => onUpdateState({ categoryId: e.target.value, applied: false })}
              className="appearance-none pr-7 pl-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-white min-w-[140px]"
            >
              {SELECTABLE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {/* Group select (only shown when groups exist) */}
          {groups.length > 0 && (
            <div className="relative">
              <select
                value={state.groupId ?? ''}
                onChange={(e) => onUpdateState({ groupId: e.target.value || null, applied: false })}
                className="appearance-none pr-7 pl-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-white min-w-[130px]"
              >
                <option value="">No group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.icon} {g.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Recurring toggle */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onUpdateState({ isRecurring: !state.isRecurring, applied: false })}
              className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                state.isRecurring ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  state.isRecurring ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className="text-xs text-gray-500 whitespace-nowrap">Recurring</span>
          </div>

          {/* Frequency select (only when recurring) */}
          {state.isRecurring && (
            <div className="relative">
              <select
                value={state.frequency}
                onChange={(e) => onUpdateState({ frequency: e.target.value as RecurringFrequency, applied: false })}
                className="appearance-none pr-7 pl-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-white"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Apply / Applied */}
          {state.applied ? (
            <span className="flex items-center gap-1 text-green-600 text-sm font-medium whitespace-nowrap">
              <Check className="w-4 h-4" />
              Applied
            </span>
          ) : (
            <button
              onClick={onApply}
              disabled={state.applying}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
            >
              {state.applying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Apply'
              )}
            </button>
          )}
        </div>
      </div>

      {state.error && (
        <p className="text-xs text-red-600 mt-2 ml-12">{state.error}</p>
      )}
    </div>
  );
}
