'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Settings2, CalendarDays } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { AnnualPlanTable } from '@/components/plan/AnnualPlanTable';
import { PlanVsActualTable } from '@/components/plan/PlanVsActualTable';
import { PlanSummaryCards } from '@/components/plan/PlanSummaryCards';
import { CashFlowCalendar } from '@/components/plan/CashFlowCalendar';
import { PlanEditor } from '@/components/plan/PlanEditor';
import {
  computeIncomeRows,
  computeExpenseRows,
  computeVariableActuals,
  buildCashFlowCalendar,
  computeMonthlySummary,
} from '@/lib/plan/computePlan';
import { formatMonthKey, prevMonthKey, nextMonthKey, monthKey as toMonthKey } from '@/lib/budgets';

type Tab = 'overview' | 'monthly';

function MonthNav({ value, onChange }: { value: string; onChange: (k: string) => void }) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1 py-1">
      <button
        onClick={() => onChange(prevMonthKey(value))}
        className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-white transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium text-gray-700 px-2 min-w-[130px] text-center">
        {formatMonthKey(value)}
      </span>
      <button
        onClick={() => onChange(nextMonthKey(value))}
        className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-white transition-all"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function PlanPage() {
  const { financialPlan, transactions, upsertPlan, isLoading } = useAppData();
  const [tab, setTab] = useState<Tab>('overview');
  const [monthKey, setMonthKey] = useState(() => toMonthKey(new Date()));
  const [editorOpen, setEditorOpen] = useState(false);

  const incomeRows = useMemo(
    () => (financialPlan ? computeIncomeRows(financialPlan, transactions, monthKey) : []),
    [financialPlan, transactions, monthKey]
  );
  const fixedRows = useMemo(
    () => (financialPlan ? computeExpenseRows(financialPlan.fixedExpenses, transactions, monthKey) : []),
    [financialPlan, transactions, monthKey]
  );
  const semiRows = useMemo(
    () => (financialPlan ? computeExpenseRows(financialPlan.semiFrequentExpenses, transactions, monthKey) : []),
    [financialPlan, transactions, monthKey]
  );
  const rentalRows = useMemo(
    () => (financialPlan ? computeExpenseRows(financialPlan.rentalItems, transactions, monthKey) : []),
    [financialPlan, transactions, monthKey]
  );
  const variableActuals = useMemo(
    () => (financialPlan ? computeVariableActuals(financialPlan.variableCategoryIds, transactions, monthKey) : []),
    [financialPlan, transactions, monthKey]
  );
  const cashFlowDays = useMemo(
    () => (financialPlan ? buildCashFlowCalendar(financialPlan, transactions, monthKey) : []),
    [financialPlan, transactions, monthKey]
  );
  const summary = useMemo(
    () => (financialPlan ? computeMonthlySummary(financialPlan, transactions, monthKey) : null),
    [financialPlan, transactions, monthKey]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Financial Plan</h1>
          {financialPlan && (
            <p className="text-sm text-gray-500 mt-0.5">{financialPlan.label}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {tab === 'monthly' && (
            <MonthNav value={monthKey} onChange={setMonthKey} />
          )}
          <button
            onClick={() => setEditorOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Settings2 className="w-4 h-4" />
            {financialPlan ? 'Edit Plan' : 'Set Up Plan'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        {([
          { key: 'overview', label: 'Annual Plan' },
          { key: 'monthly', label: 'Month vs Actual' },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {!financialPlan && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <CalendarDays className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No plan set up yet</h2>
          <p className="text-sm text-gray-500 max-w-sm mb-6">
            Add your income sources, fixed expenses, and recurring bills to see planned vs actual cashflow.
          </p>
          <button
            onClick={() => setEditorOpen(true)}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            Set Up Your Plan
          </button>
        </div>
      )}

      {/* Annual Plan tab */}
      {financialPlan && tab === 'overview' && (
        <AnnualPlanTable plan={financialPlan} />
      )}

      {/* Month vs Actual tab */}
      {financialPlan && tab === 'monthly' && (
        <div className="space-y-6">
          {summary && <PlanSummaryCards summary={summary} />}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Planned vs Actual</h2>
              <PlanVsActualTable
                incomeRows={incomeRows}
                fixedRows={fixedRows}
                semiRows={semiRows}
                rentalRows={rentalRows}
                variableActuals={variableActuals}
                variableCategoryIds={financialPlan.variableCategoryIds}
              />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Cash Flow Calendar</h2>
              <CashFlowCalendar days={cashFlowDays} monthKey={monthKey} />
            </div>
          </div>
        </div>
      )}

      {/* Plan editor */}
      <PlanEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        plan={financialPlan}
        onSave={upsertPlan}
      />
    </div>
  );
}
