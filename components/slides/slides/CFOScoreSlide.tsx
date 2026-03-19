'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import { SlideShell, SlideLabel, SlideTitle } from '../SlideShell';
import { AnalysisReport } from '@/models/types';

function ScoreGauge({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(300);

  useEffect(() => {
    let frame = 0;
    const duration = 1500;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(300 + (score - 300) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const percent = (score - 300) / (850 - 300);
  const angle = -135 + percent * 270;
  const color = score >= 750 ? '#10b981' : score >= 600 ? '#8b5cf6' : score >= 500 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-64 h-48 mx-auto">
      <svg viewBox="0 0 200 140" className="w-full h-full">
        {/* Track */}
        <path
          d="M 20 130 A 80 80 0 1 1 180 130"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Progress */}
        <path
          d="M 20 130 A 80 80 0 1 1 180 130"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray="251.3"
          strokeDashoffset={251.3 * (1 - percent)}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        />
        {/* Center text */}
        <text x="100" y="105" textAnchor="middle" fill="white" fontSize="36" fontWeight="800">
          {displayed}
        </text>
        <text x="100" y="128" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11">
          out of 850
        </text>
      </svg>
    </div>
  );
}

export function CFOScoreSlide({ report }: { report: AnalysisReport }) {
  const { overallScore, grade, title, goodHabits, badHabits, achievements } = report.gamification;

  return (
    <SlideShell>
      <SlideLabel>Financial Fitness Score</SlideLabel>
      <SlideTitle>Your CFO Score</SlideTitle>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 mt-6">
        <div className="flex flex-col items-center gap-4">
          <ScoreGauge score={overallScore} />
          <div className="text-center">
            <p className="text-4xl font-black text-white">{grade}</p>
            <p className="text-white/50 text-sm mt-1 italic">"{title}"</p>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{goodHabits.length}</p>
              <p className="text-xs text-white/50 mt-1">Good Habits</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">{badHabits.length}</p>
              <p className="text-xs text-white/50 mt-1">To Watch</p>
            </div>
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-violet-400">{achievements.length}</p>
              <p className="text-xs text-white/50 mt-1">Achievements</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Score Breakdown</p>
            {[
              { label: 'Savings Rate', value: report.savingsRate > 0.2 ? 100 : report.savingsRate > 0.1 ? 75 : 40 },
              { label: 'Spending Mix', value: 70 },
              { label: 'Consistency', value: 65 },
              { label: 'Habits', value: goodHabits.length > badHabits.length ? 80 : 50 },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 mb-2">
                <span className="text-xs text-white/50 w-28">{item.label}</span>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-violet-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
                <span className="text-xs text-white/60 w-8 text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideShell>
  );
}
