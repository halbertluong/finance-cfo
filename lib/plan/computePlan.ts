import {
  FinancialPlan,
  IncomeSource,
  PlannedExpense,
  Transaction,
  ComputedIncomeRow,
  ComputedExpenseRow,
  CashFlowEvent,
  CashFlowCalendarDay,
} from '@/models/types';

// ─── Month helpers ────────────────────────────────────────────────────────────

function parseMonthKey(monthKey: string): { year: number; month: number } {
  const [y, m] = monthKey.split('-').map(Number);
  return { year: y, month: m };
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function dayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay(); // 0=Sun, 6=Sat
}

// ─── Expense scheduling ───────────────────────────────────────────────────────

export function isExpenseDueInMonth(expense: PlannedExpense, monthKey: string): boolean {
  const { month } = parseMonthKey(monthKey);
  switch (expense.frequency) {
    case 'weekly':
    case 'monthly':
      return true;
    case 'semimonthly':
      return true;
    case 'biweekly':
      return true;
    case 'every2months':
    case 'every3months':
    case 'quarterly':
    case 'semiannual':
    case 'annual':
      return (expense.occurrenceMonths ?? []).includes(month);
    default:
      return true;
  }
}

export function monthlyEquivalent(expense: PlannedExpense): number {
  switch (expense.frequency) {
    case 'weekly':
      return expense.amount * 52 / 12;
    case 'biweekly':
      return expense.amount * 26 / 12;
    case 'semimonthly':
    case 'monthly':
      return expense.amount;
    case 'every2months':
      return expense.amount / 2;
    case 'every3months':
      return expense.amount / 3;
    case 'quarterly':
      return expense.amount / 3;
    case 'semiannual':
      return expense.amount / 6;
    case 'annual':
      return expense.amount / 12;
    default:
      return expense.amount;
  }
}

// ─── Transaction matching ─────────────────────────────────────────────────────

function txMonthKey(tx: Transaction): string {
  const d = tx.date instanceof Date ? tx.date : new Date(tx.date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getActualForCategory(
  transactions: Transaction[],
  categoryId: string,
  monthKey: string
): number {
  return transactions
    .filter((tx) => tx.categoryId === categoryId && txMonthKey(tx) === monthKey && tx.type === 'debit')
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function getActualIncomeForCategory(
  transactions: Transaction[],
  categoryId: string,
  monthKey: string
): number {
  return transactions
    .filter((tx) => tx.categoryId === categoryId && txMonthKey(tx) === monthKey && tx.type === 'credit')
    .reduce((sum, tx) => sum + tx.amount, 0);
}

// ─── Income computation ───────────────────────────────────────────────────────

export function computeIncomeRows(
  plan: FinancialPlan,
  transactions: Transaction[],
  monthKey: string
): ComputedIncomeRow[] {
  return plan.incomeSources.map((source) => {
    const totalDeductionsPerPaycheck = source.deductions.reduce((s, d) => s + d.amount, 0);
    const netPerPaycheck = source.grossPerPaycheck - totalDeductionsPerPaycheck;
    const paycheckCount = source.payDaysOfMonth.length; // semimonthly = 2 per month
    const grossMonthly = source.grossPerPaycheck * paycheckCount;
    const deductionsMonthly = totalDeductionsPerPaycheck * paycheckCount;
    const netMonthly = netPerPaycheck * paycheckCount;
    const actualMonthly = getActualIncomeForCategory(transactions, source.categoryId, monthKey);
    return {
      source,
      grossMonthly,
      deductionsMonthly,
      netMonthly,
      netPerPaycheck,
      paycheckCount,
      actualMonthly,
      variance: actualMonthly - netMonthly,
    };
  });
}

// ─── Expense computation ──────────────────────────────────────────────────────

export function computeExpenseRows(
  expenses: PlannedExpense[],
  transactions: Transaction[],
  monthKey: string
): ComputedExpenseRow[] {
  return expenses.map((expense) => {
    const plannedMonthly = monthlyEquivalent(expense);
    const scheduled = isExpenseDueInMonth(expense, monthKey);
    const plannedThisMonth = scheduled
      ? (expense.frequency === 'weekly' ? expense.amount * 4 : expense.amount)
      : 0;

    let actualThisMonth: number;
    if (expense.isIncome) {
      actualThisMonth = getActualIncomeForCategory(transactions, expense.categoryId, monthKey);
    } else {
      actualThisMonth = getActualForCategory(transactions, expense.categoryId, monthKey);
    }

    return {
      expense,
      plannedMonthly,
      isScheduledThisMonth: scheduled,
      plannedThisMonth,
      actualThisMonth,
      variance: expense.isIncome
        ? actualThisMonth - plannedThisMonth
        : plannedThisMonth - actualThisMonth, // positive = under budget (good)
    };
  });
}

export function computeVariableActuals(
  categoryIds: string[],
  transactions: Transaction[],
  monthKey: string
): { categoryId: string; actual: number }[] {
  return categoryIds.map((categoryId) => ({
    categoryId,
    actual: getActualForCategory(transactions, categoryId, monthKey),
  }));
}

// ─── Cash flow calendar ───────────────────────────────────────────────────────

export function buildCashFlowCalendar(
  plan: FinancialPlan,
  transactions: Transaction[],
  monthKey: string
): CashFlowCalendarDay[] {
  const { year, month } = parseMonthKey(monthKey);
  const totalDays = daysInMonth(year, month);

  // Build event map: day → events[]
  const eventMap: Map<number, CashFlowEvent[]> = new Map();
  for (let d = 1; d <= totalDays; d++) eventMap.set(d, []);

  function addEvent(day: number, event: CashFlowEvent) {
    const clampedDay = Math.min(day, totalDays); // handle 31 in shorter months
    eventMap.get(clampedDay)!.push(event);
  }

  // Paychecks
  for (const source of plan.incomeSources) {
    const totalDeductions = source.deductions.reduce((s, d) => s + d.amount, 0);
    const net = source.grossPerPaycheck - totalDeductions;
    for (const payDay of source.payDaysOfMonth) {
      // Check if a matching transaction exists on/near this day
      const matchingTx = transactions.find((tx) => {
        const txDate = tx.date instanceof Date ? tx.date : new Date(tx.date);
        return (
          txMonthKey(tx) === monthKey &&
          tx.categoryId === source.categoryId &&
          tx.type === 'credit' &&
          Math.abs(txDate.getDate() - payDay) <= 2
        );
      });
      addEvent(payDay, {
        label: `${source.name} paycheck`,
        amount: net,
        type: 'paycheck',
        isActual: !!matchingTx,
      });
    }
  }

  // Fixed monthly expenses
  for (const expense of plan.fixedExpenses) {
    if (!isExpenseDueInMonth(expense, monthKey)) continue;
    const day = expense.dueDayOfMonth ?? 1;
    const matchingTx = transactions.find((tx) => {
      const txDate = tx.date instanceof Date ? tx.date : new Date(tx.date);
      return (
        txMonthKey(tx) === monthKey &&
        tx.categoryId === expense.categoryId &&
        tx.type === (expense.isIncome ? 'credit' : 'debit') &&
        Math.abs(txDate.getDate() - day) <= 3
      );
    });
    const eventAmount = expense.frequency === 'weekly'
      ? expense.amount * 4
      : expense.amount;
    addEvent(day, {
      label: expense.label,
      amount: expense.isIncome ? eventAmount : -eventAmount,
      type: expense.isIncome ? 'income' : 'expense',
      isActual: !!matchingTx,
    });
  }

  // Semi-frequent expenses (only if due this month)
  for (const expense of plan.semiFrequentExpenses) {
    if (!isExpenseDueInMonth(expense, monthKey)) continue;
    const day = expense.dueDayOfOccurrenceMonth ?? expense.dueDayOfMonth ?? 15;
    addEvent(day, {
      label: expense.label,
      amount: expense.isIncome ? expense.amount : -expense.amount,
      type: expense.isIncome ? 'income' : 'expense',
      isActual: false,
    });
  }

  // Rental items
  for (const item of plan.rentalItems) {
    if (!isExpenseDueInMonth(item, monthKey)) continue;
    const day = item.dueDayOfMonth ?? 1;
    addEvent(day, {
      label: item.label,
      amount: item.isIncome ? item.amount : -item.amount,
      type: item.isIncome ? 'income' : 'expense',
      isActual: false,
    });
  }

  // Build calendar days with running balance
  let runningBalance = 0;
  const days: CashFlowCalendarDay[] = [];
  for (let d = 1; d <= totalDays; d++) {
    const events = eventMap.get(d) ?? [];
    for (const ev of events) runningBalance += ev.amount;
    days.push({
      day: d,
      isWeekend: [0, 6].includes(dayOfWeek(year, month, d)),
      events,
      runningBalance,
    });
  }

  return days;
}

// ─── Plan-level summary helpers ───────────────────────────────────────────────

export interface PlanMonthlySummary {
  plannedIncome: number;
  plannedFixedExpenses: number;
  plannedSemiFrequent: number;
  plannedRentalNet: number;
  plannedNetCashFlow: number;
  actualIncome: number;
  actualExpenses: number;
  actualNetCashFlow: number;
}

export function computeMonthlySummary(
  plan: FinancialPlan,
  transactions: Transaction[],
  monthKey: string
): PlanMonthlySummary {
  const incomeRows = computeIncomeRows(plan, transactions, monthKey);
  const fixedRows = computeExpenseRows(plan.fixedExpenses, transactions, monthKey);
  const semiRows = computeExpenseRows(plan.semiFrequentExpenses, transactions, monthKey);
  const rentalRows = computeExpenseRows(plan.rentalItems, transactions, monthKey);

  const plannedIncome = incomeRows.reduce((s, r) => s + r.netMonthly, 0);
  const plannedFixed = fixedRows
    .filter((r) => !r.expense.isIncome)
    .reduce((s, r) => s + r.plannedMonthly, 0);
  const plannedSemi = semiRows
    .filter((r) => !r.expense.isIncome)
    .reduce((s, r) => s + r.plannedMonthly, 0);
  const plannedRentalIncome = rentalRows
    .filter((r) => r.expense.isIncome)
    .reduce((s, r) => s + r.plannedMonthly, 0);
  const plannedRentalExpense = rentalRows
    .filter((r) => !r.expense.isIncome)
    .reduce((s, r) => s + r.plannedMonthly, 0);
  const plannedRentalNet = plannedRentalIncome - plannedRentalExpense;

  const actualIncome = incomeRows.reduce((s, r) => s + r.actualMonthly, 0);
  const allExpenseRows = [...fixedRows, ...semiRows];
  const actualExpenses = allExpenseRows
    .filter((r) => !r.expense.isIncome)
    .reduce((s, r) => s + r.actualThisMonth, 0);

  return {
    plannedIncome,
    plannedFixedExpenses: plannedFixed,
    plannedSemiFrequent: plannedSemi,
    plannedRentalNet,
    plannedNetCashFlow: plannedIncome + plannedRentalNet - plannedFixed - plannedSemi,
    actualIncome,
    actualExpenses,
    actualNetCashFlow: actualIncome - actualExpenses,
  };
}

// ─── Re-export used source type to avoid import duplication in UI ─────────────
export type { IncomeSource, PlannedExpense };
