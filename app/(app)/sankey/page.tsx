'use client';

import { useState, useMemo } from 'react';
import { useAppData } from '@/context/AppDataContext';
import { SankeyChart, SankeyNode, SankeyLink } from '@/components/charts/SankeyChart';
import { EmptyState } from '@/components/ui/EmptyState';
import { FinancialGroup } from '@/models/types';
import { getCategoryName, getCategoryColor } from '@/lib/categories';
import { GitBranch, TrendingUp, TrendingDown, Minus, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';

// ─── Bucket definitions ───────────────────────────────────────────────────────

const PERSONAL_BUCKETS = [
  {
    id: 'daily_living',
    label: 'Daily Living',
    color: '#16a34a',
    categories: ['housing', 'groceries', 'dining', 'transportation', 'health', 'childcare', 'other'],
  },
  {
    id: 'discretionary',
    label: 'Discretionary',
    color: '#3b82f6',
    categories: ['shopping', 'entertainment', 'subscriptions', 'pets', 'education'],
  },
  {
    id: 'vacation',
    label: 'Vacation & Travel',
    color: '#f59e0b',
    categories: ['travel'],
  },
  {
    id: 'savings',
    label: 'Savings',
    color: '#8b5cf6',
    categories: ['savings'],
  },
];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

function GroupBadge({ group }: { group: FinancialGroup }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: group.color + '20', color: group.color }}
    >
      {group.icon} {group.name}
    </span>
  );
}

const GROUP_COLORS = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0891b2', '#7c3aed', '#be185d'];
const GROUP_ICONS = ['🏠', '🏢', '🏗️', '🏦', '🌿', '⚡', '🔑'];
const GROUP_TYPES = [
  { value: 'rental', label: 'Rental Property' },
  { value: 'business', label: 'Business' },
  { value: 'personal', label: 'Personal Sub-account' },
] as const;

export default function SankeyPage() {
  const { transactions, groups, isLoading, upsertGroup, removeGroup } = useAppData();
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'rental' | 'business' | 'personal'>('rental');
  const [newColor, setNewColor] = useState(GROUP_COLORS[0]);
  const [newIcon, setNewIcon] = useState(GROUP_ICONS[0]);
  const [saving, setSaving] = useState(false);

  // ─── Build Sankey data ───────────────────────────────────────────────────────

  const sankeyData = useMemo(() => {
    const rentalGroups = groups.filter((g) => g.type === 'rental' || g.type === 'business');

    // Income sources
    let personalIncome = 0;
    const groupIncomeMap = new Map<string, number>();

    // Expense buckets (personal, no group)
    const bucketTotals = new Map<string, number>(
      PERSONAL_BUCKETS.map((b) => [b.id, 0])
    );
    const groupExpenseMap = new Map<string, number>();

    // Categorise each transaction
    for (const t of transactions) {
      if (t.categoryId === 'transfer') continue;

      if (t.groupId) {
        if (t.type === 'credit') {
          groupIncomeMap.set(t.groupId, (groupIncomeMap.get(t.groupId) ?? 0) + t.amount);
        } else {
          groupExpenseMap.set(t.groupId, (groupExpenseMap.get(t.groupId) ?? 0) + t.amount);
        }
      } else {
        if (t.type === 'credit') {
          personalIncome += t.amount;
        } else {
          const bucket = PERSONAL_BUCKETS.find((b) => b.categories.includes(t.categoryId));
          if (bucket) {
            bucketTotals.set(bucket.id, (bucketTotals.get(bucket.id) ?? 0) + t.amount);
          } else {
            // Fallback to daily living
            bucketTotals.set('daily_living', (bucketTotals.get('daily_living') ?? 0) + t.amount);
          }
        }
      }
    }

    const nodes: SankeyNode[] = [];
    const links: SankeyLink[] = [];

    // Left (income) nodes
    if (personalIncome > 0) {
      nodes.push({ id: 'personal_income', label: 'Personal Income', value: personalIncome, color: '#16a34a', layer: 0 });
    }

    for (const group of rentalGroups) {
      const inc = groupIncomeMap.get(group.id) ?? 0;
      if (inc > 0) {
        nodes.push({ id: `inc_${group.id}`, label: `${group.name} Income`, value: inc, color: group.color, layer: 0 });
      }
    }

    // Right (spending) nodes — personal buckets
    const totalPersonalExpenses = [...bucketTotals.values()].reduce((s, v) => s + v, 0);

    for (const bucket of PERSONAL_BUCKETS) {
      const val = bucketTotals.get(bucket.id) ?? 0;
      if (val > 0) {
        nodes.push({ id: bucket.id, label: bucket.label, value: val, color: bucket.color, layer: 1 });
      }
    }

    // Surplus / deficit for personal
    const personalNetBalance = personalIncome - totalPersonalExpenses;
    if (personalNetBalance > 100) {
      nodes.push({ id: 'net_surplus', label: 'Net Surplus', value: personalNetBalance, color: '#6b7280', layer: 1 });
    } else if (personalNetBalance < -100) {
      nodes.push({ id: 'net_deficit', label: 'Net Deficit', value: Math.abs(personalNetBalance), color: '#ef4444', layer: 1 });
    }

    // Group expense nodes
    for (const group of rentalGroups) {
      const exp = groupExpenseMap.get(group.id) ?? 0;
      if (exp > 0) {
        nodes.push({ id: `exp_${group.id}`, label: `${group.name} Expenses`, value: exp, color: group.color, layer: 1 });
      }
    }

    // ─── Links ────────────────────────────────────────────────────────────────

    // Personal income → personal expense buckets (proportional)
    const personalIncomeNode = nodes.find((n) => n.id === 'personal_income');
    if (personalIncomeNode) {
      const expenseNodes = nodes.filter((n) => n.layer === 1 && PERSONAL_BUCKETS.some((b) => b.id === n.id));
      for (const expNode of expenseNodes) {
        links.push({ sourceId: 'personal_income', targetId: expNode.id, value: expNode.value });
      }
      if (personalNetBalance > 100) {
        links.push({ sourceId: 'personal_income', targetId: 'net_surplus', value: personalNetBalance });
      } else if (personalNetBalance < -100) {
        // Deficit: shortage is "covered" from external (show as separate link from deficit node to daily living)
        links.push({ sourceId: 'personal_income', targetId: 'net_deficit', value: Math.abs(personalNetBalance) });
      }
    }

    // Group income → group expenses
    for (const group of rentalGroups) {
      const incId = `inc_${group.id}`;
      const expId = `exp_${group.id}`;
      const incNode = nodes.find((n) => n.id === incId);
      const expNode = nodes.find((n) => n.id === expId);

      if (incNode && expNode) {
        const linkedVal = Math.min(incNode.value, expNode.value);
        links.push({ sourceId: incId, targetId: expId, value: linkedVal });

        const netIncome = incNode.value - expNode.value;
        if (netIncome > 100) {
          // Excess rental income → savings
          const savingsNode = nodes.find((n) => n.id === 'savings');
          if (savingsNode) {
            links.push({ sourceId: incId, targetId: 'savings', value: netIncome });
          } else {
            nodes.push({ id: 'savings', label: 'Savings', value: netIncome, color: '#8b5cf6', layer: 1 });
            links.push({ sourceId: incId, targetId: 'savings', value: netIncome });
          }
        }
      } else if (incNode && !expNode) {
        // No tracked expenses: income flows to savings
        const savingsNode = nodes.find((n) => n.id === 'savings');
        if (savingsNode) {
          links.push({ sourceId: incId, targetId: 'savings', value: incNode.value });
        }
      }
    }

    return { nodes, links };
  }, [transactions, groups]);

  // ─── Summary stats ────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalIncome = transactions.filter((t) => t.type === 'credit' && t.categoryId !== 'transfer').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = transactions.filter((t) => t.type === 'debit' && t.categoryId !== 'transfer').reduce((s, t) => s + t.amount, 0);
    const groupedTxCount = transactions.filter((t) => t.groupId).length;
    return { totalIncome, totalExpenses, net: totalIncome - totalExpenses, groupedTxCount };
  }, [transactions]);

  async function handleAddGroup() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await upsertGroup({
        id: uuidv4(),
        name: newName.trim(),
        type: newType,
        color: newColor,
        icon: newIcon,
        createdAt: new Date(),
      });
      setNewName('');
      setShowAddGroup(false);
    } finally {
      setSaving(false);
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
          icon="🌊"
          title="No data for Sankey chart"
          description="Import transactions and tag them with financial groups to see your money flow."
          action={
            <Link href="/?import=true" className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors">
              Import CSV
            </Link>
          }
        />
      </div>
    );
  }

  const net = stats.net;

  return (
    <div className="p-4 sm:p-6 space-y-5 text-gray-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-green-600" />
            Money Flow
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            See where your money comes from and where it goes
          </p>
        </div>
        <button
          onClick={() => setShowAddGroup(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Financial Group
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Income', value: fmt(stats.totalIncome), color: 'text-green-600' },
          { label: 'Total Expenses', value: fmt(stats.totalExpenses), color: 'text-gray-900' },
          { label: 'Net Balance', value: fmt(Math.abs(net)), color: net >= 0 ? 'text-green-600' : 'text-red-500', prefix: net >= 0 ? '+' : '-' },
          { label: 'Tagged Transactions', value: `${stats.groupedTxCount}`, color: 'text-gray-900', suffix: ` of ${transactions.length}` },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-medium">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>
              {k.prefix}{k.value}{k.suffix}
            </p>
          </div>
        ))}
      </div>

      {/* Financial Groups */}
      {groups.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
          <h2 className="font-semibold text-sm text-gray-900 mb-3">Financial Groups</h2>
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => {
              const income = transactions.filter((t) => t.groupId === g.id && t.type === 'credit').reduce((s, t) => s + t.amount, 0);
              const expenses = transactions.filter((t) => t.groupId === g.id && t.type === 'debit').reduce((s, t) => s + t.amount, 0);
              const net = income - expenses;
              const txCount = transactions.filter((t) => t.groupId === g.id).length;
              return (
                <div
                  key={g.id}
                  className="flex items-center gap-3 border rounded-2xl px-4 py-3 bg-gray-50"
                  style={{ borderColor: g.color + '40' }}
                >
                  <span className="text-xl">{g.icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{g.name}</p>
                    <p className="text-xs text-gray-400">{txCount} transactions</p>
                    <div className="flex gap-3 mt-1 text-xs">
                      <span className="text-green-600">In: {fmt(income)}</span>
                      <span className="text-gray-500">Out: {fmt(expenses)}</span>
                      <span className={net >= 0 ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>
                        Net: {net >= 0 ? '+' : ''}{fmt(net)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeGroup(g.id)}
                    className="ml-auto p-1 text-gray-300 hover:text-red-500 transition-colors"
                    title="Remove group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Group form */}
      {showAddGroup && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-sm text-gray-900 mb-4">New Financial Group</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Rental Properties"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as typeof newType)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 bg-white"
              >
                {GROUP_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Color</label>
              <div className="flex gap-2">
                {GROUP_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="w-7 h-7 rounded-full transition-transform"
                    style={{
                      background: c,
                      transform: newColor === c ? 'scale(1.25)' : 'scale(1)',
                      outline: newColor === c ? `2px solid ${c}` : 'none',
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Icon</label>
              <div className="flex gap-2">
                {GROUP_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setNewIcon(icon)}
                    className={`w-8 h-8 rounded-lg text-base transition-all ${newIcon === icon ? 'bg-green-100 ring-2 ring-green-500' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowAddGroup(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAddGroup}
              disabled={!newName.trim() || saving}
              className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-40 transition-all"
            >
              {saving ? 'Saving…' : 'Create Group'}
            </button>
          </div>
        </div>
      )}

      {/* Sankey chart */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-sm text-gray-900">Income → Spending Flow</h2>
          {stats.groupedTxCount === 0 && groups.length === 0 && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1">
              Tag merchants in{' '}
              <Link href="/review" className="underline font-semibold">Smart Review</Link>
              {' '}to separate rental / personal flows
            </span>
          )}
        </div>

        {sankeyData.nodes.length < 2 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Not enough categorized data to render a flow chart.
            <br />
            <Link href="/review" className="text-green-600 underline mt-2 inline-block">
              Categorize transactions in Smart Review →
            </Link>
          </div>
        ) : (
          <SankeyChart
            nodes={sankeyData.nodes}
            links={sankeyData.links}
            height={Math.max(380, sankeyData.nodes.filter((n) => n.layer === 1).length * 70)}
          />
        )}
      </div>

      {/* Legend */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Spending Buckets</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PERSONAL_BUCKETS.map((b) => (
            <div key={b.id} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: b.color }} />
              <span className="text-xs text-gray-600">{b.label}</span>
            </div>
          ))}
          {groups.map((g) => (
            <div key={g.id} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: g.color }} />
              <span className="text-xs text-gray-600">{g.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
