'use client';

import { ComputedIncomeRow, ComputedExpenseRow } from '@/models/types';
import { CATEGORY_MAP } from '@/lib/categories';

interface Props {
  incomeRows: ComputedIncomeRow[];
  fixedRows: ComputedExpenseRow[];
  semiRows: ComputedExpenseRow[];
  rentalRows: ComputedExpenseRow[];
  variableActuals: { categoryId: string; actual: number }[];
  variableCategoryIds: string[];
}

const fmt = (n: number, parens = false) => {
  const str = Math.abs(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  return parens && n < 0 ? `(${str})` : str;
};

function VarianceCell({ variance, favorable }: { variance: number; favorable: boolean }) {
  if (variance === 0) return <td className="px-3 py-2 text-sm text-right tabular-nums text-gray-400">—</td>;
  const color = favorable ? 'text-green-600' : 'text-red-500';
  return (
    <td className={`px-3 py-2 text-sm text-right tabular-nums font-medium ${color}`}>
      {variance > 0 ? '+' : ''}{fmt(variance)}
    </td>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={4} className="px-3 py-2 bg-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-600">
        {label}
      </td>
    </tr>
  );
}

function TotalRow({ label, planned, actual, favorableWhenPositive = true }: {
  label: string;
  planned: number;
  actual: number;
  favorableWhenPositive?: boolean;
}) {
  const variance = actual - planned;
  const favorable = favorableWhenPositive ? variance >= 0 : variance <= 0;
  return (
    <tr className="bg-gray-50 font-semibold border-t border-gray-200">
      <td className="px-3 py-2 text-sm text-gray-800" colSpan={1}>{label}</td>
      <td className="px-3 py-2 text-sm text-right tabular-nums text-gray-700">{fmt(planned)}</td>
      <td className="px-3 py-2 text-sm text-right tabular-nums text-gray-900">{actual ? fmt(actual) : '—'}</td>
      <VarianceCell variance={variance} favorable={favorable} />
    </tr>
  );
}

export function PlanVsActualTable({
  incomeRows,
  fixedRows,
  semiRows,
  rentalRows,
  variableActuals,
  variableCategoryIds,
}: Props) {
  const totalIncomePlanned = incomeRows.reduce((s, r) => s + r.netMonthly, 0);
  const totalIncomeActual = incomeRows.reduce((s, r) => s + r.actualMonthly, 0);

  const totalFixedPlanned = fixedRows.filter((r) => !r.expense.isIncome).reduce((s, r) => s + r.plannedMonthly, 0);
  const totalFixedActual = fixedRows.filter((r) => !r.expense.isIncome).reduce((s, r) => s + r.actualThisMonth, 0);

  const totalSemiPlanned = semiRows.filter((r) => !r.expense.isIncome && r.isScheduledThisMonth).reduce((s, r) => s + r.plannedThisMonth, 0);
  const totalSemiActual = semiRows.filter((r) => !r.expense.isIncome && r.isScheduledThisMonth).reduce((s, r) => s + r.actualThisMonth, 0);

  const rentalIncomePlanned = rentalRows.filter((r) => r.expense.isIncome).reduce((s, r) => s + r.plannedMonthly, 0);
  const rentalIncomeActual = rentalRows.filter((r) => r.expense.isIncome).reduce((s, r) => s + r.actualThisMonth, 0);
  const rentalExpensePlanned = rentalRows.filter((r) => !r.expense.isIncome).reduce((s, r) => s + r.plannedMonthly, 0);
  const rentalExpenseActual = rentalRows.filter((r) => !r.expense.isIncome).reduce((s, r) => s + r.actualThisMonth, 0);
  const rentalNetPlanned = rentalIncomePlanned - rentalExpensePlanned;
  const rentalNetActual = rentalIncomeActual - rentalExpenseActual;

  const totalVarActual = variableActuals.reduce((s, v) => s + v.actual, 0);

  const netCashflowPlanned = totalIncomePlanned + rentalNetPlanned - totalFixedPlanned - totalSemiPlanned;
  const netCashflowActual = totalIncomeActual + rentalNetActual - totalFixedActual - totalSemiActual - totalVarActual;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full text-sm border-collapse min-w-[480px]">
        <thead>
          <tr className="bg-gray-800 text-white text-xs">
            <th className="px-3 py-2.5 text-left">Description</th>
            <th className="px-3 py-2.5 text-right">Planned</th>
            <th className="px-3 py-2.5 text-right">Actual</th>
            <th className="px-3 py-2.5 text-right">Variance</th>
          </tr>
        </thead>
        <tbody>
          {/* ── Income ─────────────────────────────────── */}
          <SectionHeader label="Income (Net Take-Home)" />
          {incomeRows.map((row) => {
            const variance = row.actualMonthly - row.netMonthly;
            return (
              <tr key={row.source.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-sm text-gray-800">{row.source.name}</td>
                <td className="px-3 py-2 text-sm text-right tabular-nums text-gray-700">{fmt(row.netMonthly)}</td>
                <td className="px-3 py-2 text-sm text-right tabular-nums">{row.actualMonthly ? fmt(row.actualMonthly) : '—'}</td>
                <VarianceCell variance={variance} favorable={variance >= 0} />
              </tr>
            );
          })}
          <TotalRow label="Total Income" planned={totalIncomePlanned} actual={totalIncomeActual} favorableWhenPositive={true} />

          {/* ── Fixed Monthly ──────────────────────────── */}
          <SectionHeader label="Fixed Monthly Expenses" />
          {fixedRows.map((row) => {
            const cat = CATEGORY_MAP[row.expense.categoryId];
            const favorable = row.expense.isIncome ? row.variance >= 0 : row.variance >= 0;
            return (
              <tr key={row.expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 text-sm text-gray-700">{cat?.icon ?? ''} {row.expense.label}</td>
                <td className="px-3 py-2 text-sm text-right tabular-nums text-gray-600">{fmt(row.plannedMonthly)}</td>
                <td className="px-3 py-2 text-sm text-right tabular-nums">{row.actualThisMonth ? fmt(row.actualThisMonth) : '—'}</td>
                <VarianceCell variance={row.variance} favorable={favorable} />
              </tr>
            );
          })}
          <TotalRow label="Total Fixed" planned={totalFixedPlanned} actual={totalFixedActual} favorableWhenPositive={false} />

          {/* ── Semi-Frequent ─────────────────────────── */}
          {semiRows.length > 0 && (
            <>
              <SectionHeader label="Semi-Frequent Bills" />
              {semiRows.map((row) => {
                const cat = CATEGORY_MAP[row.expense.categoryId];
                return (
                  <tr key={row.expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm text-gray-700">
                      {cat?.icon ?? ''} {row.expense.label}
                      {!row.isScheduledThisMonth && (
                        <span className="ml-2 text-xs text-gray-400 italic">(not due this month)</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm text-right tabular-nums text-gray-600">
                      {row.isScheduledThisMonth ? fmt(row.plannedThisMonth) : '—'}
                    </td>
                    <td className="px-3 py-2 text-sm text-right tabular-nums">
                      {row.isScheduledThisMonth && row.actualThisMonth ? fmt(row.actualThisMonth) : '—'}
                    </td>
                    <VarianceCell
                      variance={row.isScheduledThisMonth ? row.variance : 0}
                      favorable={row.variance >= 0}
                    />
                  </tr>
                );
              })}
              {totalSemiPlanned > 0 && (
                <TotalRow label="Total Semi-Frequent (this month)" planned={totalSemiPlanned} actual={totalSemiActual} favorableWhenPositive={false} />
              )}
            </>
          )}

          {/* ── Rental Property ───────────────────────── */}
          {rentalRows.length > 0 && (
            <>
              <SectionHeader label="Rental Property" />
              {rentalRows.map((row) => {
                const favorable = row.expense.isIncome ? row.variance >= 0 : row.variance >= 0;
                return (
                  <tr key={row.expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm text-gray-700">{row.expense.label}</td>
                    <td className="px-3 py-2 text-sm text-right tabular-nums text-gray-600">{fmt(row.plannedMonthly)}</td>
                    <td className="px-3 py-2 text-sm text-right tabular-nums">{row.actualThisMonth ? fmt(row.actualThisMonth) : '—'}</td>
                    <VarianceCell variance={row.variance} favorable={favorable} />
                  </tr>
                );
              })}
              <TotalRow label="Rental Net" planned={rentalNetPlanned} actual={rentalNetActual} favorableWhenPositive={true} />
            </>
          )}

          {/* ── Variable Expenses ────────────────────── */}
          {variableCategoryIds.length > 0 && (
            <>
              <SectionHeader label="Variable Expenses (Actuals)" />
              {variableActuals.map(({ categoryId, actual }) => {
                const cat = CATEGORY_MAP[categoryId];
                return (
                  <tr key={categoryId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm text-gray-700">{cat?.icon ?? ''} {cat?.name ?? categoryId}</td>
                    <td className="px-3 py-2 text-sm text-right tabular-nums text-gray-400">—</td>
                    <td className="px-3 py-2 text-sm text-right tabular-nums font-medium text-gray-900">
                      {actual ? fmt(actual) : '—'}
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-gray-400">—</td>
                  </tr>
                );
              })}
              {totalVarActual > 0 && (
                <tr className="bg-gray-50 font-semibold border-t border-gray-200">
                  <td className="px-3 py-2 text-sm text-gray-800">Total Variable</td>
                  <td className="px-3 py-2 text-sm text-right tabular-nums text-gray-400">—</td>
                  <td className="px-3 py-2 text-sm text-right tabular-nums text-gray-900">{fmt(totalVarActual)}</td>
                  <td className="px-3 py-2 text-sm text-right text-gray-400">—</td>
                </tr>
              )}
            </>
          )}

          {/* ── Net Cashflow ─────────────────────────── */}
          <tr className="bg-green-50 font-bold border-t-2 border-gray-400">
            <td className="px-3 py-2.5 text-sm text-gray-900">Net Monthly Cashflow</td>
            <td className="px-3 py-2.5 text-sm text-right tabular-nums text-gray-800">{fmt(netCashflowPlanned)}</td>
            <td className="px-3 py-2.5 text-sm text-right tabular-nums text-gray-900">{netCashflowActual ? fmt(netCashflowActual) : '—'}</td>
            <VarianceCell variance={netCashflowActual - netCashflowPlanned} favorable={(netCashflowActual - netCashflowPlanned) >= 0} />
          </tr>
        </tbody>
      </table>
    </div>
  );
}
