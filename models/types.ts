export type TransactionSource = 'csv_upload' | 'plaid' | 'amazon' | 'venmo';
export type TransactionType = 'debit' | 'credit';
export type CategoryType = 'essential' | 'discretionary' | 'savings' | 'income' | 'transfer';
export type TrendDirection = 'increasing' | 'decreasing' | 'stable';
export type Grade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
export type GradeSimple = 'A' | 'B' | 'C' | 'D' | 'F';
export type HabitType = 'good' | 'bad' | 'neutral';
export type ImpactLevel = 'high' | 'medium' | 'low';
export type AccountType = 'checking' | 'savings' | 'credit' | 'investment' | 'loan' | 'other';

// ─── Raw Ingestion ────────────────────────────────────────────────────────────

export interface RawTransaction {
  id: string;
  source: TransactionSource;
  rawDate: string;
  rawDescription: string;
  rawAmount: string;
  rawCategory?: string;
  accountName?: string;
  metadata: Record<string, string>;
}

// ─── Normalized Domain Models ─────────────────────────────────────────────────

export interface Transaction {
  id: string;
  date: Date;
  description: string;
  normalizedMerchant: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  subcategoryId?: string;
  accountId: string;
  source: TransactionSource;
  tags: string[];
  confidence: number;
  isManualOverride: boolean;
  groupId?: string;
}

export type FinancialGroupType = 'personal' | 'rental' | 'business';

export interface FinancialGroup {
  id: string;
  name: string;
  type: FinancialGroupType;
  color: string;
  icon: string;
  createdAt: Date;
}

export interface Subcategory {
  id: string;
  parentId: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  subcategories: Subcategory[];
  monthlyBudget?: number;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  institution: string;
  isAsset: boolean;
}

export interface AccountBalance {
  id: string;
  accountId: string;
  balance: number;
  date: Date;
  note?: string;
}

// ─── Budgets ──────────────────────────────────────────────────────────────────

export interface Budget {
  id: string;
  categoryId: string;
  monthKey: string; // 'YYYY-MM'
  amount: number;
  rollover: boolean;
  createdAt: Date;
}

export interface BudgetStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOver: boolean;
  rolloverAmount: number;
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  color: string;
  icon: string;
  createdAt: Date;
  completedAt?: Date;
}

// ─── Recurring Transactions ───────────────────────────────────────────────────

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';

export interface RecurringTransaction {
  id: string;
  merchantName: string;
  normalizedMerchant: string;
  categoryId: string;
  amount: number;
  frequency: RecurringFrequency;
  nextDueDate?: Date;
  lastSeenDate?: Date;
  active: boolean;
  isManuallyAdded: boolean;
  autoDetected: boolean;
}

export interface NetWorthSnapshot {
  id: string;
  date: Date;
  accounts: AccountBalance[];
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  changeFromPrevious?: number;
  changePercentFromPrevious?: number;
  source: 'manual' | 'plaid' | 'derived';
}

// ─── Analysis Outputs ─────────────────────────────────────────────────────────

export interface MonthlyAmount {
  year: number;
  month: number;
  amount: number;
}

export interface MerchantSummary {
  merchant: string;
  totalSpent: number;
  visitCount: number;
  averageTransaction: number;
}

export interface CategoryScore {
  score: number;
  grade: GradeSimple;
  badge?: string;
  insight: string;
}

export interface CategoryAnalysis {
  categoryId: string;
  totalSpent: number;
  transactionCount: number;
  percentOfTotal: number;
  monthlyBreakdown: MonthlyAmount[];
  trend: TrendDirection;
  trendPercent: number;
  topMerchants: MerchantSummary[];
  score: CategoryScore;
}

// ─── Gamification ─────────────────────────────────────────────────────────────

export interface SpendingHabit {
  id: string;
  type: HabitType;
  title: string;
  description: string;
  evidence: string[];
  icon: string;
  impact: ImpactLevel;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

export interface GamificationReport {
  overallScore: number;
  grade: Grade;
  title: string;
  categoryScores: CategoryScore[];
  goodHabits: SpendingHabit[];
  badHabits: SpendingHabit[];
  achievements: Achievement[];
  yearOverYearImprovement?: number;
}

// ─── Slide Narrative ─────────────────────────────────────────────────────────

export interface SlideNarrative {
  executiveSummary: string;
  spendingStory: string;
  netWorthStory: string;
  habitsStory: string;
  recommendationsStory: string;
  cfoSignOff: string;
}

// ─── Final Report ─────────────────────────────────────────────────────────────

export interface AnalysisReport {
  id: string;
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  familyName: string;
  transactions: Transaction[];
  categoryAnalyses: CategoryAnalysis[];
  netWorthSnapshots: NetWorthSnapshot[];
  currentNetWorth: number;
  netWorthChange: number;
  totalIncome: number;
  totalExpenses: number;
  savingsRate: number;
  gamification: GamificationReport;
  narrative: SlideNarrative;
  insights: string[];
}

// ─── CSV Column Mapping ───────────────────────────────────────────────────────

export interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
  type?: string;
  category?: string;
  account?: string;
}

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  sampleRows: Record<string, string>[];
}

// ─── AI API Response Shapes ───────────────────────────────────────────────────

export interface CategorizationResult {
  id: string;
  categoryId: string;
  subcategoryId?: string;
  normalizedMerchant: string;
  confidence: number;
  tags: string[];
}

export interface CategorizationBatchResponse {
  results: CategorizationResult[];
}

// ─── Financial Plan ───────────────────────────────────────────────────────────

export type PlanFrequency =
  | 'weekly' | 'semimonthly' | 'biweekly' | 'monthly'
  | 'every2months' | 'every3months' | 'quarterly'
  | 'semiannual' | 'annual';

export interface PaycheckDeduction {
  id: string;
  label: string;
  amount: number; // positive value; rendered as negative (deduction)
  type: 'tax' | '401k' | 'insurance' | 'espp' | 'other';
}

export interface IncomeSource {
  id: string;
  name: string; // "Mackenzie", "Halbert"
  grossPerPaycheck: number;
  paychecksPerYear: number; // 24 for semimonthly
  payDaysOfMonth: number[]; // [6, 21] or [15, 31]
  deductions: PaycheckDeduction[];
  categoryId: string;
  accountId?: string;
}

export interface PlannedExpense {
  id: string;
  label: string;
  amount: number; // positive = outflow; set isIncome=true for income items
  frequency: PlanFrequency;
  dueDayOfMonth?: number; // for monthly: which day (1, 2, 8, 17...)
  occurrenceMonths?: number[]; // for non-monthly: which months 1=Jan..12=Dec
  dueDayOfOccurrenceMonth?: number;
  categoryId: string;
  accountId?: string;
  isIncome?: boolean; // true for rental income lines
  creditCard?: string; // "AmEx", "Chase Freedom", etc.
  notes?: string;
}

export interface FinancialPlan {
  id: string;
  label: string; // "2026 Family Plan"
  year: number;
  incomeSources: IncomeSource[];
  fixedExpenses: PlannedExpense[];
  semiFrequentExpenses: PlannedExpense[];
  rentalItems: PlannedExpense[];
  variableCategoryIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Computed types for plan computation library
export interface ComputedIncomeRow {
  source: IncomeSource;
  grossMonthly: number;
  deductionsMonthly: number;
  netMonthly: number;
  netPerPaycheck: number;
  paycheckCount: number;
  actualMonthly: number;
  variance: number;
}

export interface ComputedExpenseRow {
  expense: PlannedExpense;
  plannedMonthly: number;
  isScheduledThisMonth: boolean;
  plannedThisMonth: number;
  actualThisMonth: number;
  variance: number;
}

export interface CashFlowEvent {
  label: string;
  amount: number; // positive = inflow, negative = outflow
  type: 'paycheck' | 'expense' | 'income';
  isActual: boolean;
}

export interface CashFlowCalendarDay {
  day: number;
  isWeekend: boolean;
  events: CashFlowEvent[];
  runningBalance: number;
}
