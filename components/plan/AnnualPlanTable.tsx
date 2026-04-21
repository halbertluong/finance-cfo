'use client';

import { FinancialPlan } from '@/models/types';
import { monthlyEquivalent } from '@/lib/plan/computePlan';
import { CATEGORY_MAP } from '@/lib/categories';

interface Props {
  plan: FinancialPlan;
}

const SECTION_HEADER = 'bg-gray-100 text-gray-700 font-semibold text-xs uppercase tracking-wide';
const EARNER_HEADER = 'bg-blue-50 text-blue-800 font-semibold text-sm';
const TOTAL_ROW = 'bg-yellow-50 font-semibold text-gray-900';
const DEDUCTION_ROW = 'text-gray-600 pl-8';
const COMBINED_ROW = 'bg-green-50 font-bold text-green-900';

function currency(n: number, showSign = false): string {
  const abs = Math.abs(n);
  const str = abs.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  if (showSign && n < 0) return `(${str})`;
  if (showSign && n > 0) return str;
  return str;
}

function pct(n: number, gross: number): string {
  if (!gross) return '';
  return `${((n / gross) * 100).toFixed(2)}%`;
}

interface RowProps {
  label: string;
  dueDate?: string;
  perPaycheck?: number | null;
  perMonth: number;
  annual: number;
  percentage?: string;
  className?: string;
  isDeduction?: boolean;
  isIncome?: boolean;
  indent?: boolean;
}

function Row({ label, dueDate, perPaycheck, perMonth, annual, percentage, className = '', isDeduction, isIncome, indent }: RowProps) {
  const sign = isDeduction ? -1 : 1;
  const color = isDeduction
    ? 'text-red-600'
    : isIncome
    ? 'text-green-700'
    : 'text-gray-800';

  return (
    <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${className}`}>
      <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">{dueDate ?? ''}</td>
      <td className={`px-3 py-2 text-sm ${indent ? 'pl-8' : ''} ${color}`}>{label}</td>
      <td className={`px-3 py-2 text-sm text-right tabular-nums ${color}`}>
        {perPaycheck != null ? currency(sign * perPaycheck, isDeduction) : ''}
      </td>
      <td className={`px-3 py-2 text-sm text-right tabular-nums ${color}`}>
        {currency(sign * perMonth, isDeduction)}
      </td>
      <td className={`px-3 py-2 text-sm text-right tabular-nums ${color}`}>
        {currency(sign * annual, isDeduction)}
      </td>
      <td className="px-3 py-2 text-xs text-right text-gray-400">{percentage ?? ''}</td>
    </tr>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={6} className={`px-3 py-2 ${SECTION_HEADER}`}>{label}</td>
    </tr>
  );
}

function EarnerHeader({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={6} className={`px-3 py-2 ${EARNER_HEADER}`}>{label}</td>
    </tr>
  );
}

export function AnnualPlanTable({ plan }: Props) {
  const combinedGross = plan.incomeSources.reduce(
    (s, src) => s + src.grossPerPaycheck * src.payDaysOfMonth.length * 12,
    0
  );

  // Combined net pay per month across all earners
  const combinedNetMonthly = plan.incomeSources.reduce((s, src) => {
    const totalDed = src.deductions.reduce((d, x) => d + x.amount, 0);
    const net = src.grossPerPaycheck - totalDed;
    return s + net * src.payDaysOfMonth.length;
  }, 0);

  const totalFixedMonthly = plan.fixedExpenses
    .filter((e) => !e.isIncome)
    .reduce((s, e) => s + monthlyEquivalent(e), 0);

  const totalFixedIncomeMonthly = plan.fixedExpenses
    .filter((e) => e.isIncome)
    .reduce((s, e) => s + monthlyEquivalent(e), 0);

  const netAfterFixed = combinedNetMonthly + totalFixedIncomeMonthly - totalFixedMonthly;

  const totalSemiMonthly = plan.semiFrequentExpenses
    .filter((e) => !e.isIncome)
    .reduce((s, e) => s + monthlyEquivalent(e), 0);

  const rentalIncomeMonthly = plan.rentalItems
    .filter((e) => e.isIncome)
    .reduce((s, e) => s + monthlyEquivalent(e), 0);
  const rentalExpenseMonthly = plan.rentalItems
    .filter((e) => !e.isIncome)
    .reduce((s, e) => s + monthlyEquivalent(e), 0);
  const rentalNetMonthly = rentalIncomeMonthly - rentalExpenseMonthly;

  const cashflowMonthly = netAfterFixed - totalSemiMonthly + rentalNetMonthly;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="w-full text-sm border-collapse min-w-[640px]">
        <thead>
          <tr className="bg-gray-800 text-white text-xs">
            <th className="px-3 py-2.5 text-left w-28">Due Date</th>
            <th className="px-3 py-2.5 text-left">Description</th>
            <th className="px-3 py-2.5 text-right">Per Paycheck</th>
            <th className="px-3 py-2.5 text-right">Per Month</th>
            <th className="px-3 py-2.5 text-right">Annual</th>
            <th className="px-3 py-2.5 text-right">% of Gross</th>
          </tr>
        </thead>
        <tbody>
          {/* ─── Income Sources ─────────────────────────────────────── */}
          {plan.incomeSources.map((src) => {
            const totalDed = src.deductions.reduce((s, d) => s + d.amount, 0);
            const netPerPaycheck = src.grossPerPaycheck - totalDed;
            const paychecksPerMonth = src.payDaysOfMonth.length;
            const grossAnnual = src.grossPerPaycheck * src.paychecksPerYear;
            const payDayStr = src.payDaysOfMonth.map((d) => `${d}th`).join(' / ');

            return (
              <>
                <EarnerHeader key={`hdr-${src.id}`} label={`${src.name} (${payDayStr} each month)`} />
                <Row
                  key={`gross-${src.id}`}
                  label="Gross Pay (Before Taxes)"
                  perPaycheck={src.grossPerPaycheck}
                  perMonth={src.grossPerPaycheck * paychecksPerMonth}
                  annual={grossAnnual}
                  percentage="100.00%"
                  isIncome
                />
                {src.deductions.map((d) => (
                  <Row
                    key={d.id}
                    label={d.label}
                    indent
                    perPaycheck={d.amount}
                    perMonth={d.amount * paychecksPerMonth}
                    annual={d.amount * src.paychecksPerYear}
                    percentage={pct(d.amount * src.paychecksPerYear, grossAnnual)}
                    isDeduction
                  />
                ))}
                <tr key={`ded-total-${src.id}`} className={`border-b border-gray-100 ${TOTAL_ROW}`}>
                  <td className="px-3 py-2 text-xs text-gray-400" />
                  <td className="px-3 py-2 text-sm">Total Deductions</td>
                  <td className="px-3 py-2 text-sm text-right tabular-nums text-red-600">({currency(totalDed)})</td>
                  <td className="px-3 py-2 text-sm text-right tabular-nums text-red-600">({currency(totalDed * paychecksPerMonth)})</td>
                  <td className="px-3 py-2 text-sm text-right tabular-nums text-red-600">({currency(totalDed * src.paychecksPerYear)})</td>
                  <td className="px-3 py-2 text-xs text-right text-gray-400">{pct(totalDed * src.paychecksPerYear, grossAnnual)}</td>
                </tr>
                <tr key={`net-${src.id}`} className={`border-b-2 border-gray-300 ${TOTAL_ROW} bg-yellow-50`}>
                  <td className="px-3 py-2 text-xs text-gray-400" />
                  <td className="px-3 py-2 text-sm text-green-800 font-semibold">Total Take Home</td>
                  <td className="px-3 py-2 text-sm text-right tabular-nums text-green-700 font-semibold">{currency(netPerPaycheck)}</td>
                  <td className="px-3 py-2 text-sm text-right tabular-nums text-green-700 font-semibold">{currency(netPerPaycheck * paychecksPerMonth)}</td>
                  <td className="px-3 py-2 text-sm text-right tabular-nums text-green-700 font-semibold">{currency(netPerPaycheck * src.paychecksPerYear)}</td>
                  <td className="px-3 py-2 text-xs text-right text-gray-400">{pct(netPerPaycheck * src.paychecksPerYear, grossAnnual)}</td>
                </tr>
              </>
            );
          })}

          {/* Combined Net Pay */}
          {plan.incomeSources.length > 1 && (
            <>
              <SectionHeader label="" />
              <tr className={`border-b-2 border-gray-400 ${COMBINED_ROW}`}>
                <td className="px-3 py-2 text-xs text-gray-500" />
                <td className="px-3 py-2 text-sm">Combined Net Pay (After Taxes / Ins. / Invest)</td>
                <td className="px-3 py-2 text-sm text-right tabular-nums">{currency(combinedNetMonthly / 2)}</td>
                <td className="px-3 py-2 text-sm text-right tabular-nums">{currency(combinedNetMonthly)}</td>
                <td className="px-3 py-2 text-sm text-right tabular-nums">{currency(combinedNetMonthly * 12)}</td>
                <td className="px-3 py-2 text-xs text-right text-gray-500">{pct(combinedNetMonthly * 12, combinedGross)}</td>
              </tr>
            </>
          )}

          {/* ─── Fixed Monthly Expenses ──────────────────────────────── */}
          <SectionHeader label="Monthly Recurring Expenses" />
          {plan.fixedExpenses.map((e) => {
            const cat = CATEGORY_MAP[e.categoryId];
            const dueStr = e.dueDayOfMonth ? `${e.dueDayOfMonth}${e.dueDayOfMonth === 1 ? 'st' : e.dueDayOfMonth === 2 ? 'nd' : e.dueDayOfMonth === 3 ? 'rd' : 'th'}` : '';
            const monthly = monthlyEquivalent(e);
            return (
              <Row
                key={e.id}
                label={`${cat?.icon ?? ''} ${e.label}`}
                dueDate={dueStr}
                perMonth={monthly}
                annual={monthly * 12}
                percentage={combinedNetMonthly ? pct(monthly, combinedNetMonthly) : ''}
                isDeduction={!e.isIncome}
                isIncome={e.isIncome}
              />
            );
          })}
          <tr className={`border-b-2 border-gray-300 ${TOTAL_ROW}`}>
            <td className="px-3 py-2" />
            <td className="px-3 py-2 text-sm">Total Fixed</td>
            <td className="px-3 py-2" />
            <td className="px-3 py-2 text-sm text-right tabular-nums text-red-600">({currency(totalFixedMonthly - totalFixedIncomeMonthly)})</td>
            <td className="px-3 py-2 text-sm text-right tabular-nums text-red-600">({currency((totalFixedMonthly - totalFixedIncomeMonthly) * 12)})</td>
            <td className="px-3 py-2 text-xs text-right text-gray-400">{pct(totalFixedMonthly - totalFixedIncomeMonthly, combinedNetMonthly)}</td>
          </tr>
          <tr className="border-b-2 border-gray-400 bg-blue-50 font-semibold">
            <td className="px-3 py-2" />
            <td className="px-3 py-2 text-sm text-blue-900">Net Pay (After Fixed Expenses)</td>
            <td className="px-3 py-2" />
            <td className="px-3 py-2 text-sm text-right tabular-nums text-blue-800">{currency(netAfterFixed)}</td>
            <td className="px-3 py-2 text-sm text-right tabular-nums text-blue-800">{currency(netAfterFixed * 12)}</td>
            <td className="px-3 py-2 text-xs text-right text-gray-400">{pct(netAfterFixed * 12, combinedGross)}</td>
          </tr>

          {/* ─── Semi-Frequent Bills ─────────────────────────────────── */}
          {plan.semiFrequentExpenses.length > 0 && (
            <>
              <SectionHeader label="Semi-Frequent Bills" />
              {plan.semiFrequentExpenses.map((e) => {
                const cat = CATEGORY_MAP[e.categoryId];
                const monthly = monthlyEquivalent(e);
                return (
                  <Row
                    key={e.id}
                    label={`${cat?.icon ?? ''} ${e.label}`}
                    dueDate={e.occurrenceMonths?.map((m) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]).join(', ')}
                    perMonth={monthly}
                    annual={monthly * 12}
                    percentage={pct(monthly, combinedNetMonthly)}
                    isDeduction={!e.isIncome}
                    isIncome={e.isIncome}
                  />
                );
              })}
              <tr className={`border-b border-gray-200 ${TOTAL_ROW}`}>
                <td className="px-3 py-2" />
                <td className="px-3 py-2 text-sm">Total Semi-Frequent</td>
                <td className="px-3 py-2" />
                <td className="px-3 py-2 text-sm text-right tabular-nums text-red-600">({currency(totalSemiMonthly)})</td>
                <td className="px-3 py-2 text-sm text-right tabular-nums text-red-600">({currency(totalSemiMonthly * 12)})</td>
                <td className="px-3 py-2 text-xs text-right text-gray-400">{pct(totalSemiMonthly, combinedNetMonthly)}</td>
              </tr>
            </>
          )}

          {/* ─── Rental Property ────────────────────────────────────── */}
          {plan.rentalItems.length > 0 && (
            <>
              <SectionHeader label="Rental Property Income" />
              {plan.rentalItems.map((e) => {
                const monthly = monthlyEquivalent(e);
                return (
                  <Row
                    key={e.id}
                    label={e.label}
                    perMonth={monthly}
                    annual={monthly * 12}
                    isDeduction={!e.isIncome}
                    isIncome={e.isIncome}
                  />
                );
              })}
              <tr className={`border-b border-gray-200 ${TOTAL_ROW}`}>
                <td className="px-3 py-2" />
                <td className="px-3 py-2 text-sm">Total Cash Flow</td>
                <td className="px-3 py-2" />
                <td className={`px-3 py-2 text-sm text-right tabular-nums ${rentalNetMonthly >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {rentalNetMonthly >= 0 ? currency(rentalNetMonthly) : `(${currency(Math.abs(rentalNetMonthly))})`}
                </td>
                <td className={`px-3 py-2 text-sm text-right tabular-nums ${rentalNetMonthly >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {rentalNetMonthly >= 0 ? currency(rentalNetMonthly * 12) : `(${currency(Math.abs(rentalNetMonthly) * 12)})`}
                </td>
                <td className="px-3 py-2" />
              </tr>
            </>
          )}

          {/* ─── Variable Expenses ──────────────────────────────────── */}
          {plan.variableCategoryIds.length > 0 && (
            <>
              <SectionHeader label="Variable Expenses (Actuals from Transactions)" />
              {plan.variableCategoryIds.map((catId) => {
                const cat = CATEGORY_MAP[catId];
                return (
                  <tr key={catId} className="border-b border-gray-100">
                    <td className="px-3 py-2 text-xs text-gray-400" />
                    <td className="px-3 py-2 text-sm text-gray-600">{cat?.icon ?? ''} {cat?.name ?? catId}</td>
                    <td colSpan={4} className="px-3 py-2 text-sm text-gray-400 italic text-right">— see Month vs Actual tab —</td>
                  </tr>
                );
              })}
            </>
          )}

          {/* ─── Cashflow Summary ───────────────────────────────────── */}
          <SectionHeader label="" />
          <tr className={`border-t-2 border-gray-400 ${COMBINED_ROW}`}>
            <td className="px-3 py-2" />
            <td className="px-3 py-2 text-sm">Planned Monthly Cashflow</td>
            <td className="px-3 py-2" />
            <td className={`px-3 py-2 text-sm text-right tabular-nums font-bold ${cashflowMonthly >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {currency(cashflowMonthly)}
            </td>
            <td className={`px-3 py-2 text-sm text-right tabular-nums font-bold ${cashflowMonthly >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {currency(cashflowMonthly * 12)}
            </td>
            <td className="px-3 py-2 text-xs text-right text-gray-400">{pct(cashflowMonthly, combinedNetMonthly)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
