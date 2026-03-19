'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthKey, prevMonthKey, nextMonthKey } from '@/lib/budgets';

interface Props {
  value: string;
  onChange: (key: string) => void;
  availableKeys?: string[];
}

export function MonthPicker({ value, onChange, availableKeys }: Props) {
  const current = new Date().toISOString().slice(0, 7);
  const canGoNext = !availableKeys || availableKeys[0] !== value;
  const canGoPrev = !availableKeys || availableKeys[availableKeys.length - 1] !== value;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(prevMonthKey(value))}
        disabled={!canGoPrev}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium text-white min-w-[120px] text-center">
        {formatMonthKey(value)}
        {value === current && (
          <span className="ml-1.5 text-xs text-violet-400">(this month)</span>
        )}
      </span>
      <button
        onClick={() => onChange(nextMonthKey(value))}
        disabled={!canGoNext}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
