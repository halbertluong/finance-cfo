'use client';

import { SlideShell, SlideLabel, SlideTitle } from '../SlideShell';
import { AnalysisReport } from '@/models/types';
import { getTopMerchants } from '@/lib/analysis/aggregator';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#f5f3ff'];

export function TopMerchantsSlide({ report }: { report: AnalysisReport }) {
  const merchants = getTopMerchants(report.transactions, 10);
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  const data = merchants.map((m) => ({
    name: m.merchant.length > 18 ? m.merchant.slice(0, 18) + '…' : m.merchant,
    fullName: m.merchant,
    total: Math.round(m.totalSpent),
    visits: m.visitCount,
  }));

  return (
    <SlideShell>
      <SlideLabel>Merchant Analysis</SlideLabel>
      <SlideTitle>Top 10 Merchants by Spend</SlideTitle>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 mt-6">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} layout="vertical" barSize={18}>
              <XAxis
                type="number"
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={110}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1a2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: 'white',
                }}
                formatter={(val, _, props) => [
                  `${fmt(Number(val ?? 0))} (${(props.payload as { visits?: number })?.visits ?? 0} visits)`,
                  'Total Spent',
                ]}
              />
              <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:w-56 space-y-1.5">
          {data.slice(0, 5).map((m, i) => (
            <div key={m.fullName} className="flex items-center gap-2 text-sm">
              <span className="text-white/30 w-4 text-right">{i + 1}.</span>
              <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
              <span className="text-white/70 flex-1 truncate">{m.fullName}</span>
              <span className="text-white font-semibold">{fmt(m.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}
