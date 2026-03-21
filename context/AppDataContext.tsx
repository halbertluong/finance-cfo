'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  loadTransactions, loadBudgets, loadGoals, loadAccounts,
  loadLatestBalances as loadAccountBalances, loadRecurring, loadLatestReport,
  updateTransactionCategory, saveBudget, removeBudget as dbDeleteBudget,
  saveGoal, removeGoal as dbDeleteGoal, saveAccount, removeAccount as dbDeleteAccount,
  saveAccountBalance, saveRecurring, removeRecurring as dbDeleteRecurring,
} from '@/lib/db/api-client';
import {
  Transaction, Budget, Goal, Account, AccountBalance,
  RecurringTransaction, AnalysisReport,
} from '@/models/types';

interface AppDataContextValue {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  accounts: Account[];
  accountBalances: AccountBalance[];
  recurringItems: RecurringTransaction[];
  latestReport: AnalysisReport | null;
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
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [recurringItems, setRecurringItems] = useState<RecurringTransaction[]>([]);
  const [latestReport, setLatestReport] = useState<AnalysisReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [txs, budg, gls, accs, bals, recs, report] = await Promise.all([
        loadTransactions(),
        loadBudgets(),
        loadGoals(),
        loadAccounts(),
        loadAccountBalances(),
        loadRecurring(),
        loadLatestReport(),
      ]);
      setTransactions(txs);
      setBudgets(budg);
      setGoals(gls);
      setAccounts(accs);
      setAccountBalances(bals);
      setRecurringItems(recs);
      setLatestReport(report);
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

  return (
    <AppDataContext.Provider value={{
      transactions, budgets, goals, accounts, accountBalances, recurringItems,
      latestReport, isLoading, refresh,
      updateCategory, upsertBudget, removeBudget, upsertGoal, removeGoal,
      upsertAccount, removeAccount, addBalance, upsertRecurring, removeRecurring,
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
