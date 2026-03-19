'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ArrowLeftRight, PiggyBank, TrendingUp,
  Target, RefreshCw, Upload, Presentation, ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { href: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { href: '/net-worth', icon: TrendingUp, label: 'Net Worth' },
  { href: '/goals', icon: Target, label: 'Goals' },
  { href: '/recurring', icon: RefreshCw, label: 'Recurring' },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 bg-[#0d0d15] border-r border-white/5 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
            $
          </div>
          <span className="font-bold text-white text-sm">Family CFO</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150 group ${
                active
                  ? 'bg-violet-500/20 text-violet-300'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-violet-400' : 'text-white/30 group-hover:text-white/50'}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
        >
          <Upload className="w-4 h-4" />
          Import CSV
        </Link>
        <Link
          href="/presentation"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-all"
        >
          <Presentation className="w-4 h-4" />
          <span className="flex-1">CFO Report</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </aside>
  );
}
