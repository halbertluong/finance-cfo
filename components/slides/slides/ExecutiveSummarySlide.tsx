'use client';

import { motion } from 'framer-motion';
import { SlideShell, SlideLabel, SlideTitle, KPICard } from '../SlideShell';
import { AnalysisReport } from '@/models/types';

export function ExecutiveSummarySlide({ report }: { report: AnalysisReport }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const savingsFmt = `${(report.savingsRate * 100).toFixed(1)}%`;
  const netWorthChangeFmt = `${report.netWorthChange >= 0 ? '+' : ''}${fmt(report.netWorthChange)}`;

  return (
    <SlideShell>
      <SlideLabel>Executive Summary</SlideLabel>
      <SlideTitle>The Year at a Glance</SlideTitle>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <KPICard label="Total Income" value={fmt(report.totalIncome)} color="green" />
        <KPICard label="Total Expenses" value={fmt(report.totalExpenses)} color="amber" />
        <KPICard label="Savings Rate" value={savingsFmt} sub="of income saved" color="violet" />
        <KPICard
          label="Net Worth Δ"
          value={netWorthChangeFmt}
          sub="change this period"
          color={report.netWorthChange >= 0 ? 'green' : 'red'}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 bg-white/5 rounded-2xl p-6 border border-white/10 flex-1"
      >
        <p className="text-xs text-violet-400 uppercase tracking-wider mb-3">CFO Summary</p>
        <p className="text-white/80 text-base leading-relaxed">{report.narrative.executiveSummary}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {report.insights.map((insight, i) => (
            <span key={i} className="text-xs bg-violet-500/20 text-violet-300 rounded-full px-3 py-1">
              {insight}
            </span>
          ))}
        </div>
      </motion.div>
    </SlideShell>
  );
}
