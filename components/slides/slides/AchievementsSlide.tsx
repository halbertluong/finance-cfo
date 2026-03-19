'use client';

import { motion } from 'framer-motion';
import { SlideShell, SlideLabel, SlideTitle } from '../SlideShell';
import { AnalysisReport } from '@/models/types';

export function AchievementsSlide({ report }: { report: AnalysisReport }) {
  const { achievements } = report.gamification;

  return (
    <SlideShell>
      <SlideLabel>Achievements</SlideLabel>
      <SlideTitle>🏅 Unlocked This Period</SlideTitle>

      <div className="flex-1 flex flex-col items-center justify-center mt-6">
        {achievements.length === 0 ? (
          <div className="text-center">
            <p className="text-6xl mb-4">🎯</p>
            <p className="text-white/40 text-lg">No achievements yet — but you're building towards them!</p>
            <p className="text-white/20 text-sm mt-2">Keep tracking to unlock milestones.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {achievements.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.15, type: 'spring', stiffness: 200 }}
                className="bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 rounded-2xl p-6 text-center"
              >
                <div className="text-4xl mb-3">{a.icon}</div>
                <p className="text-white font-bold text-sm">{a.name}</p>
                <p className="text-white/50 text-xs mt-1">{a.description}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </SlideShell>
  );
}
