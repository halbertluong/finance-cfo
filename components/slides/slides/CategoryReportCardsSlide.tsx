'use client';

import { motion } from 'framer-motion';
import { SlideShell, SlideLabel, SlideTitle } from '../SlideShell';
import { AnalysisReport } from '@/models/types';
import { getCategoryName, getCategoryIcon, getCategoryColor } from '@/lib/categories';

const gradeColors: Record<string, string> = {
  A: 'text-emerald-400',
  B: 'text-blue-400',
  C: 'text-amber-400',
  D: 'text-orange-400',
  F: 'text-red-400',
};

export function CategoryReportCardsSlide({ report }: { report: AnalysisReport }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const categories = report.categoryAnalyses
    .filter((ca) => ca.totalSpent > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 8);

  return (
    <SlideShell>
      <SlideLabel>Category Performance</SlideLabel>
      <SlideTitle>Report Cards</SlideTitle>

      <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        {categories.map((ca, i) => (
          <motion.div
            key={ca.categoryId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xl">{getCategoryIcon(ca.categoryId)}</div>
                <p className="text-xs text-white/60 mt-1 font-medium">{getCategoryName(ca.categoryId)}</p>
              </div>
              <span className={`text-2xl font-black ${gradeColors[ca.score.grade] ?? 'text-white'}`}>
                {ca.score.grade}
              </span>
            </div>

            <p className="text-base font-bold text-white">{fmt(ca.totalSpent)}</p>

            <div className="h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${ca.score.score}%`,
                  background: getCategoryColor(ca.categoryId),
                }}
              />
            </div>

            {ca.score.badge && (
              <p className="text-xs text-white/40 truncate">{ca.score.badge}</p>
            )}
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}
