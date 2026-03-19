'use client';

import { motion } from 'framer-motion';
import { SlideShell, SlideLabel, SlideTitle } from '../SlideShell';
import { AnalysisReport, SpendingHabit } from '@/models/types';

function HabitCard({ habit, index }: { habit: SpendingHabit; index: number }) {
  const impactColors = { high: 'bg-violet-500/20 border-violet-500/30', medium: 'bg-blue-500/20 border-blue-500/30', low: 'bg-slate-500/20 border-slate-500/30' };
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`flex gap-4 p-4 rounded-2xl border ${impactColors[habit.impact]}`}
    >
      <div className="text-3xl">{habit.icon}</div>
      <div className="flex-1">
        <p className="text-white font-semibold text-sm">{habit.title}</p>
        <p className="text-white/60 text-xs mt-1">{habit.description}</p>
      </div>
      <span className="text-xs text-white/30 capitalize self-start mt-1">{habit.impact}</span>
    </motion.div>
  );
}

export function HabitsSlide({ report, type }: { report: AnalysisReport; type: 'good' | 'bad' }) {
  const habits = type === 'good' ? report.gamification.goodHabits : report.gamification.badHabits;
  const isEmpty = habits.length === 0;

  return (
    <SlideShell>
      <SlideLabel>{type === 'good' ? 'Strengths' : 'Opportunities'}</SlideLabel>
      <SlideTitle>
        {type === 'good' ? '🏆 Good Habits' : '👀 Habits to Watch'}
      </SlideTitle>

      <div className="flex-1 flex flex-col gap-3 mt-6">
        {isEmpty ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/30 text-lg">
              {type === 'good' ? 'Habits analysis pending...' : 'Nothing to flag here — solid work!'}
            </p>
          </div>
        ) : (
          habits.map((habit, i) => <HabitCard key={habit.id} habit={habit} index={i} />)
        )}
      </div>

      <p className="text-white/40 text-sm mt-4 italic">
        {type === 'good' ? report.narrative.habitsStory : report.narrative.recommendationsStory}
      </p>
    </SlideShell>
  );
}
