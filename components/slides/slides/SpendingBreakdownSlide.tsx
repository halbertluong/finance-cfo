'use client';

import { SlideShell, SlideLabel, SlideTitle } from '../SlideShell';
import { AnalysisReport } from '@/models/types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getCategoryColor, getCategoryName, getCategoryIcon } from '@/lib/categories';

export function SpendingBreakdownSlide({ report }: { report: AnalysisReport }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const data = report.categoryAnalyses
    .filter((ca) => ca.totalSpent > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 8)
    .map((ca) => ({
      name: getCategoryName(ca.categoryId),
      value: Math.round(ca.totalSpent),
      color: getCategoryColor(ca.categoryId),
      icon: getCategoryIcon(ca.categoryId),
      percent: ca.percentOfTotal,
    }));

  return (
    <SlideShell>
      <SlideLabel>Spending Breakdown</SlideLabel>
      <SlideTitle>Where Did the Money Go?</SlideTitle>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 mt-6">
        {/* Chart */}
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1a1a2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: 'white',
                }}
                formatter={(val) => [fmt(Number(val ?? 0)), 'Spent']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="lg:w-64 space-y-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <span className="text-sm text-white/70 flex-1">{item.icon} {item.name}</span>
              <span className="text-sm font-semibold text-white">{item.percent.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-white/40 text-sm mt-2 italic">{report.narrative.spendingStory}</p>
    </SlideShell>
  );
}
