'use client';

import { motion } from 'framer-motion';
import { SlideShell } from '../SlideShell';
import { AnalysisReport } from '@/models/types';
import { format } from 'date-fns';

export function TitleSlide({ report }: { report: AnalysisReport }) {
  const period = `${format(new Date(report.periodStart), 'MMM yyyy')} – ${format(new Date(report.periodEnd), 'MMM yyyy')}`;
  const netWorthFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(report.currentNetWorth);

  return (
    <SlideShell>
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs uppercase tracking-[0.3em] text-violet-400 mb-4">Annual Financial State of the Union</p>
          <h1 className="text-5xl lg:text-7xl font-black text-white leading-none mb-3">
            The {report.familyName}<br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Report
            </span>
          </h1>
          <p className="text-lg text-white/40">{period}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex gap-8 mt-4"
        >
          <div className="text-center">
            <p className="text-xs text-white/40 uppercase tracking-wider">Net Worth</p>
            <p className="text-3xl font-bold text-white mt-1">{netWorthFmt}</p>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <p className="text-xs text-white/40 uppercase tracking-wider">CFO Score</p>
            <p className="text-3xl font-bold text-violet-400 mt-1">{report.gamification.overallScore}</p>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <p className="text-xs text-white/40 uppercase tracking-wider">Grade</p>
            <p className="text-3xl font-bold text-emerald-400 mt-1">{report.gamification.grade}</p>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-white/30 text-sm mt-4 italic"
        >
          "{report.gamification.title}"
        </motion.p>
      </div>
    </SlideShell>
  );
}
