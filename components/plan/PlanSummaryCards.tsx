'use client';

import { ElementType } from 'react';
import { PlanMonthlySummary } from '@/lib/plan/computePlan';
import { TrendingUp, TrendingDown, DollarSign, ArrowRightLeft } from 'lucide-react';

interface Props {
  summary: PlanMonthlySummary;
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function Card({
  label,
  planned,
  actual,
  icon: Icon,
  positiveIsGood = true,
}: {
  label: string;
  planned: number;
  actual: number;
  icon: ElementType;
  positiveIsGood?: boolean;
}) {
  const variance = actual - planned;
  const hasActual = actual !== 0;
  const isFavorable = positiveIsGood ? variance >= 0 : variance <= 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-gray-400">Planned</span>
          <span className="text-sm font-semibold text-gray-700">{fmt(planned)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-gray-400">Actual</span>
          <span className={`text-sm font-semibold ${hasActual ? 'text-gray-900' : 'text-gray-400'}`}>
            {hasActual ? fmt(actual) : '—'}
          </span>
        </div>
        {hasActual && (
          <div className={`flex items-center justify-between pt-1 border-t border-gray-100 mt-1`}>
            <span className="text-xs text-gray-400">Variance</span>
            <span className={`text-xs font-semibold flex items-center gap-1 ${isFavorable ? 'text-green-600' : 'text-red-500'}`}>
              {isFavorable
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />}
              {variance > 0 ? '+' : ''}{fmt(variance)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function PlanSummaryCards({ summary }: Props) {
  const totalPlannedExpenses = summary.plannedFixedExpenses + summary.plannedSemiFrequent;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card
        label="Income"
        planned={summary.plannedIncome}
        actual={summary.actualIncome}
        icon={TrendingUp}
        positiveIsGood={true}
      />
      <Card
        label="Fixed Expenses"
        planned={totalPlannedExpenses}
        actual={summary.actualExpenses}
        icon={TrendingDown}
        positiveIsGood={false}
      />
      <Card
        label="Rental Net"
        planned={summary.plannedRentalNet}
        actual={0}
        icon={DollarSign}
        positiveIsGood={true}
      />
      <Card
        label="Net Cashflow"
        planned={summary.plannedNetCashFlow}
        actual={summary.actualNetCashFlow}
        icon={ArrowRightLeft}
        positiveIsGood={true}
      />
    </div>
  );
}
