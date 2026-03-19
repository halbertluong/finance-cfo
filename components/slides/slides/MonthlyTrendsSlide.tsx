'use client';

import { SlideShell, SlideLabel, SlideTitle } from '../SlideShell';
import { AnalysisReport } from '@/models/types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { getMonthlySpendingData } from '@/lib/analysis/aggregator';
import { format, parse } from 'date-fns';

export function MonthlyTrendsSlide({ report }: { report: AnalysisReport }) {
  const raw = getMonthlySpendingData(report.transactions);
  const data = raw.map((d) => ({
    ...d,
    month: format(parse(d.month, 'yyyy-MM', new Date()), 'MMM yy'),
    income: Math.round(d.income),
    expenses: Math.round(d.expenses),
  }));

  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;

  return (
    <SlideShell>
      <SlideLabel>Cashflow Over Time</SlideLabel>
      <SlideTitle>Month by Month</SlideTitle>

      <div className="flex-1 mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmt}
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: '#1a1a2e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: 'white',
              }}
              formatter={(val) =>
                [`$${Number(val ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`, '']
              }
            />
            <Legend
              wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}
            />
            <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SlideShell>
  );
}
