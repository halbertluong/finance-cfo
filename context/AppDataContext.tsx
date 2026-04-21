'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  loadTransactions, loadBudgets, loadGoals, loadAccounts,
  loadLatestBalances as loadAccountBalances, loadRecurring, loadLatestReport,
  updateTransactionCategory, saveBudget, removeBudget as dbDeleteBudget,
  saveGoal, removeGoal as dbDeleteGoal, saveAccount, removeAccount as dbDeleteAccount,
  saveAccountBalance, saveRecurring, removeRecurring as dbDeleteRecurring,
  loadGroups, saveGroup, removeGroup as dbDeleteGroup,
  loadPlan, savePlan,
} from '@/lib/db/api-client';
import {
  Transaction, Budget, Goal, Account, AccountBalance,
  RecurringTransaction, AnalysisReport, FinancialGroup, FinancialPlan,
} from '@/models/types';

interface AppDataContextValue {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  accounts: Account[];
  accountBalances: AccountBalance[];
  recurringItems: RecurringTransaction[];
  groups: FinancialGroup[];
  latestReport: AnalysisReport | null;
  financialPlan: FinancialPlan | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  updateCategory: (id: string, categoryId: string) => Promise<void>;
  upsertBudget: (budget: Budget) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;
  upsertGoal: (goal: Goal) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  upsertAccount: (account: Account) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  addBalance: (balance: AccountBalance) => Promise<void>;
  upsertRecurring: (item: RecurringTransaction) => Promise<void>;
  removeRecurring: (id: string) => Promise<void>;
  upsertGroup: (group: FinancialGroup) => Promise<void>;
  removeGroup: (id: string) => Promise<void>;
  upsertPlan: (plan: FinancialPlan) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [recurringItems, setRecurringItems] = useState<RecurringTransaction[]>([]);
  const [groups, setGroups] = useState<FinancialGroup[]>([]);
  const [latestReport, setLatestReport] = useState<AnalysisReport | null>(null);
  const [financialPlan, setFinancialPlan] = useState<FinancialPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [txs, budg, gls, accs, bals, recs, grps, report, plan] = await Promise.all([
        loadTransactions().catch((e) => { console.error('loadTransactions failed:', e); return [] as Transaction[]; }),
        loadBudgets().catch((e) => { console.error('loadBudgets failed:', e); return [] as Budget[]; }),
        loadGoals().catch((e) => { console.error('loadGoals failed:', e); return [] as Goal[]; }),
        loadAccounts().catch((e) => { console.error('loadAccounts failed:', e); return [] as Account[]; }),
        loadAccountBalances().catch((e) => { console.error('loadAccountBalances failed:', e); return [] as AccountBalance[]; }),
        loadRecurring().catch((e) => { console.error('loadRecurring failed:', e); return [] as RecurringTransaction[]; }),
        loadGroups().catch((e) => { console.error('loadGroups failed:', e); return [] as FinancialGroup[]; }),
        loadLatestReport().catch((e) => { console.error('loadLatestReport failed:', e); return null; }),
        loadPlan().catch((e) => { console.error('loadPlan failed:', e); return null; }),
      ]);
      setTransactions(txs);
      setBudgets(budg);
      setGoals(gls);
      setAccounts(accs);
      setAccountBalances(bals);
      setRecurringItems(recs);
      setGroups(grps);
      setLatestReport(report);
      setFinancialPlan(plan);
    } catch (e) {
      console.error('AppDataContext: failed to load data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const updateCategory = async (id: string, categoryId: string) => {
    await updateTransactionCategory(id, categoryId);
    setTransactions((prev) => prev.map((t) => t.id === id ? { ...t, categoryId, isManualOverride: true } : t));
  };

  const upsertBudget = async (budget: Budget) => {
    await saveBudget(budget);
    setBudgets((prev) => {
      const idx = prev.findIndex((b) => b.id === budget.id);
      return idx >= 0 ? prev.map((b) => b.id === budget.id ? budget : b) : [...prev, budget];
    });
  };

  const removeBudget = async (id: string) => {
    await dbDeleteBudget(id);
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  const upsertGoal = async (goal: Goal) => {
    await saveGoal(goal);
    setGoals((prev) => {
      const idx = prev.findIndex((g) => g.id === goal.id);
      return idx >= 0 ? prev.map((g) => g.id === goal.id ? goal : g) : [...prev, goal];
    });
  };

  const removeGoal = async (id: string) => {
    await dbDeleteGoal(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const upsertAccount = async (account: Account) => {
    await saveAccount(account);
    setAccounts((prev) => {
      const idx = prev.findIndex((a) => a.id === account.id);
      return idx >= 0 ? prev.map((a) => a.id === account.id ? account : a) : [...prev, account];
    });
  };

  const removeAccount = async (id: string) => {
    await dbDeleteAccount(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setAccountBalances((prev) => prev.filter((b) => b.accountId !== id));
  };

  const addBalance = async (balance: AccountBalance) => {
    await saveAccountBalance(balance);
    setAccountBalances((prev) => {
      const idx = prev.findIndex((b) => b.id === balance.id);
      return idx >= 0 ? prev.map((b) => b.id === balance.id ? balance : b) : [...prev, balance];
    });
  };

  const upsertRecurring = async (item: RecurringTransaction) => {
    await saveRecurring(item);
    setRecurringItems((prev) => {
      const idx = prev.findIndex((r) => r.id === item.id);
      return idx >= 0 ? prev.map((r) => r.id === item.id ? item : r) : [...prev, item];
    });
  };

  const removeRecurring = async (id: string) => {
    await dbDeleteRecurring(id);
    setRecurringItems((prev) => prev.filter((r) => r.id !== id));
  };

  const upsertGroup = async (group: FinancialGroup) => {
    await saveGroup(group);
    setGroups((prev) => {
      const idx = prev.findIndex((g) => g.id === group.id);
      return idx >= 0 ? prev.map((g) => g.id === group.id ? group : g) : [...prev, group];
    });
  };

  const removeGroup = async (id: string) => {
    await dbDeleteGroup(id);
    setGroups((prev) => prev.filter((g) => g.id !== id));
    setTransactions((prev) => prev.map((t) => t.groupId === id ? { ...t, groupId: undefined } : t));
  };

  const upsertPlan = async (plan: FinancialPlan) => {
    await savePlan(plan);
    setFinancialPlan(plan);
  };

  return (
    <AppDataContext.Provider value={{
      transactions, budgets, goals, accounts, accountBalances, recurringItems,
      groups, latestReport, financialPlan, isLoading, refresh,
      updateCategory, upsertBudget, removeBudget, upsertGoal, removeGoal,
      upsertAccount, removeAccount, addBalance, upsertRecurring, removeRecurring,
      upsertGroup, removeGroup, upsertPlan,
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
