'use client';

import { motion } from 'framer-motion';
import { SlideShell } from '../SlideShell';
import { AnalysisReport } from '@/models/types';
import { format } from 'date-fns';

export function SignOffSlide({ report }: { report: AnalysisReport }) {
  return (
    <SlideShell>
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-6xl mb-6">📊</div>
          <p className="text-xs uppercase tracking-[0.3em] text-violet-400 mb-4">From Your AI CFO</p>
          <blockquote className="text-2xl lg:text-3xl font-light text-white leading-relaxed max-w-2xl italic">
            "{report.narrative.cfoSignOff}"
          </blockquote>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-12 h-px bg-white/20" />
          <p className="text-white/40 text-sm">
            Generated {format(new Date(report.generatedAt), 'MMMM d, yyyy')}
          </p>
          <p className="text-white/20 text-xs">
            {report.transactions.length} transactions analyzed • Powered by Claude
          </p>
        </motion.div>
      </div>
    </SlideShell>
  );
}
