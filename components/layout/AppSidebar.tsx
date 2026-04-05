'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank, TrendingUp,
  Target, RefreshCw, Upload, Presentation, ChevronRight,
  Download, LogOut, Menu, X,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { href: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { href: '/net-worth', icon: TrendingUp, label: 'Net Worth' },
  { href: '/goals', icon: Target, label: 'Goals' },
  { href: '/recurring', icon: RefreshCw, label: 'Recurring' },
];

async function exportTransactionsCSV() {
  const res = await fetch('/api/data/transactions');
  if (!res.ok) return;
  const transactions = await res.json();
  if (transactions.length === 0) return;
  const headers = ['date', 'description', 'merchant', 'amount', 'type', 'category', 'account', 'tags'];
  const rows = transactions.map((t: {
    date: string; description: string; normalizedMerchant: string;
    amount: number; type: string; categoryId: string; accountId: string; tags: string[];
  }) => [
    new Date(t.date).toISOString().split('T')[0],
    `"${t.description.replace(/"/g, '""')}"`,
    `"${t.normalizedMerchant.replace(/"/g, '""')}"`,
    t.amount, t.type, t.categoryId, t.accountId,
    `"${t.tags.join(', ')}"`,
  ]);
  const csv = [headers.join(','), ...rows.map((r: unknown[]) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/sign-in');
  };

  const currentLabel =
    NAV_ITEMS.find((n) => !!pathname && (pathname === n.href || pathname.startsWith(n.href + '/')))?.label ??
    'Family CFO';

  const navItems = (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-xs font-bold text-white">
            $
          </div>
          <span className="font-bold text-white text-sm tracking-tight">Family CFO</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = !!pathname && (pathname === href || pathname.startsWith(href + '/'));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group ${
                active
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-green-100/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-green-200/50 group-hover:text-white/80'}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-green-100/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <Upload className="w-4 h-4" />
          Import CSV
        </Link>
        <button
          onClick={exportTransactionsCSV}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-green-100/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <Download className="w-4 h-4" />
          Export Data
        </button>
        <Link
          href="/presentation"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm bg-white/10 text-white hover:bg-white/20 transition-all"
        >
          <Presentation className="w-4 h-4" />
          <span className="flex-1">CFO Report</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-green-100/60 hover:text-red-300 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col h-full bg-[#1a5e2e]">
        {navItems}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-[#1a5e2e] flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-xs font-bold text-white">
            $
          </div>
          <span className="font-bold text-white text-sm">{currentLabel}</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-[#1a5e2e] md:hidden shadow-2xl">
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {navItems}
          </aside>
        </>
      )}
    </>
  );
}
