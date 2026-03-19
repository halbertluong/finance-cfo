'use client';

import { useState, useMemo } from 'react';
import { useAppData } from '@/context/AppDataContext';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Account, AccountBalance } from '@/models/types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'investment', 'loan', 'other'] as const;

function AccountModal({ account, onSave, onClose }: {
  account?: Account;
  onSave: (a: Account) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(account?.name ?? '');
  const [type, setType] = useState<Account['type']>(account?.type ?? 'checking');
  const [institution, setInstitution] = useState(account?.institution ?? '');
  const [isAsset, setIsAsset] = useState(account?.isAsset ?? true);

  const handleSave = () => {
    if (!name) return;
    onSave({ id: account?.id ?? uuidv4(), name, type, institution, isAsset });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-white/60 mb-1.5 uppercase tracking-wider">Account Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chase Checking"
          className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-400" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/60 mb-1.5 uppercase tracking-wider">Type</label>
          <select value={type} onChange={(e) => { const t = e.target.value as Account['type']; setType(t); setIsAsset(!['credit', 'loan'].includes(t)); }}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-400">
            {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/60 mb-1.5 uppercase tracking-wider">Institution</label>
          <input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="e.g. Chase Bank"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-400" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setIsAsset((v) => !v)}
          className={`relative w-10 h-6 rounded-full transition-colors ${isAsset ? 'bg-emerald-600' : 'bg-red-600'}`}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isAsset ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
        <p className="text-sm text-white">{isAsset ? 'Asset (adds to net worth)' : 'Liability (subtracts from net worth)'}</p>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/60 text-sm hover:bg-white/5 transition-colors">Cancel</button>
        <button onClick={handleSave} disabled={!name}
          className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold disabled:opacity-40 transition-colors">
          {account ? 'Update' : 'Add'} Account
        </button>
      </div>
    </div>
  );
}

function BalanceCell({ accountId, current, onSave }: { accountId: string; current?: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(current ?? ''));

  const commit = () => {
    const n = parseFloat(val);
    if (!isNaN(n)) onSave(n);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-white/40 text-sm">$</span>
        <input autoFocus value={val} onChange={(e) => setVal(e.target.value)}
          onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          className="w-28 bg-white/10 border border-violet-400 rounded-lg px-2 py-1 text-sm text-white focus:outline-none tabular-nums" />
        <button onClick={commit} className="text-emerald-400 hover:text-emerald-300"><Check className="w-4 h-4" /></button>
        <button onClick={() => setEditing(false)} className="text-white/40 hover:text-white/70"><X className="w-4 h-4" /></button>
      </div>
    );
  }

  return (
    <button onClick={() => setEditing(true)} className="text-white font-semibold hover:text-violet-300 transition-colors tabular-nums">
      {current !== undefined ? fmt(current) : <span className="text-white/30 text-sm">Click to set</span>}
    </button>
  );
}

export default function NetWorthPage() {
  const { accounts, accountBalances, upsertAccount, removeAccount, addBalance, isLoading } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | undefined>();

  const latestBalanceMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of accountBalances) {
      if (map[b.accountId] === undefined) {
        map[b.accountId] = b.balance;
      } else {
        const existing = accountBalances.find((x) => x.accountId === b.accountId && x.balance === map[b.accountId]);
        if (existing && new Date(b.date) > new Date(existing.date)) {
          map[b.accountId] = b.balance;
        }
      }
    }
    return map;
  }, [accountBalances]);

  const assets = accounts.filter((a) => a.isAsset);
  const liabilities = accounts.filter((a) => !a.isAsset);
  const totalAssets = assets.reduce((s, a) => s + (latestBalanceMap[a.id] ?? 0), 0);
  const totalLiabilities = liabilities.reduce((s, a) => s + (latestBalanceMap[a.id] ?? 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  // Build trend data from accountBalances grouped by month
  const trendData = useMemo(() => {
    const months: Record<string, number> = {};
    const sorted = [...accountBalances].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const lastByAccount: Record<string, number> = {};

    for (const b of sorted) {
      lastByAccount[b.accountId] = b.balance;
      const monthStr = format(new Date(b.date), 'MMM yy');
      let nw = 0;
      for (const acc of accounts) {
        const bal = lastByAccount[acc.id] ?? 0;
        nw += acc.isAsset ? bal : -bal;
      }
      months[monthStr] = nw;
    }

    return Object.entries(months).map(([month, value]) => ({ month, value }));
  }, [accountBalances, accounts]);

  const handleSaveBalance = async (accountId: string, balance: number) => {
    await addBalance({ id: uuidv4(), accountId, balance, date: new Date() });
  };

  if (isLoading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Net Worth</h1>
        <button onClick={() => { setEditing(undefined); setModalOpen(true); }}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState icon="🏦" title="No accounts yet" description="Add your accounts to track your net worth over time."
          action={<button onClick={() => setModalOpen(true)} className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-colors">Add First Account</button>} />
      ) : (
        <div className="space-y-6">
          {/* Net worth hero */}
          <div className="bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 rounded-2xl p-6">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Total Net Worth</p>
            <p className={`text-5xl font-black ${netWorth >= 0 ? 'text-white' : 'text-red-400'}`}>{fmt(netWorth)}</p>
            <div className="flex gap-6 mt-4 text-sm">
              <div><p className="text-white/40">Total Assets</p><p className="text-emerald-400 font-semibold">{fmt(totalAssets)}</p></div>
              <div><p className="text-white/40">Total Liabilities</p><p className="text-red-400 font-semibold">{fmt(totalLiabilities)}</p></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Accounts */}
            <div className="space-y-4">
              {/* Assets */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-emerald-400">Assets</h2>
                  <span className="text-sm font-bold text-emerald-400">{fmt(totalAssets)}</span>
                </div>
                {assets.length === 0 ? (
                  <p className="text-white/30 text-sm text-center py-6">No asset accounts</p>
                ) : (
                  assets.map((acc) => (
                    <div key={acc.id} className="flex items-center gap-3 px-5 py-3 border-b border-white/5 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{acc.name}</p>
                        <p className="text-xs text-white/40">{acc.institution} · {acc.type}</p>
                      </div>
                      <BalanceCell accountId={acc.id} current={latestBalanceMap[acc.id]} onSave={(v) => handleSaveBalance(acc.id, v)} />
                      <div className="flex gap-1 ml-2">
                        <button onClick={() => { setEditing(acc); setModalOpen(true); }} className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-white/70 rounded transition-colors"><Pencil className="w-3 h-3" /></button>
                        <button onClick={() => removeAccount(acc.id)} className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-red-400 rounded transition-colors"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Liabilities */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-red-400">Liabilities</h2>
                  <span className="text-sm font-bold text-red-400">{fmt(totalLiabilities)}</span>
                </div>
                {liabilities.length === 0 ? (
                  <p className="text-white/30 text-sm text-center py-6">No liability accounts</p>
                ) : (
                  liabilities.map((acc) => (
                    <div key={acc.id} className="flex items-center gap-3 px-5 py-3 border-b border-white/5 last:border-0">
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{acc.name}</p>
                        <p className="text-xs text-white/40">{acc.institution} · {acc.type}</p>
                      </div>
                      <BalanceCell accountId={acc.id} current={latestBalanceMap[acc.id]} onSave={(v) => handleSaveBalance(acc.id, v)} />
                      <div className="flex gap-1 ml-2">
                        <button onClick={() => { setEditing(acc); setModalOpen(true); }} className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-white/70 rounded transition-colors"><Pencil className="w-3 h-3" /></button>
                        <button onClick={() => removeAccount(acc.id)} className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-red-400 rounded transition-colors"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Trend chart */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h2 className="text-sm font-semibold mb-4">Net Worth Over Time</h2>
              {trendData.length < 2 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <p className="text-white/30 text-sm">Update your balances monthly to see your trend.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="nwGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '12px' }}
                      formatter={(v) => [fmt(Number(v)), 'Net Worth']} />
                    <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} fill="url(#nwGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Account' : 'Add Account'}>
        <AccountModal account={editing}
          onSave={async (a) => { await upsertAccount(a); setModalOpen(false); }}
          onClose={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}
