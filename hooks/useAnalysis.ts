'use client';

import { useState, useCallback } from 'react';
import { Transaction, AnalysisReport, ColumnMapping } from '@/models/types';
import { normalizeTransactions } from '@/lib/csv/normalizer';
import { merchantLookup, splitIntoBatches, applyCategorizationResults } from '@/lib/ai/categorizer';
import { aggregateByCategory, getTotalIncome, getTotalExpenses, getTopMerchants } from '@/lib/analysis/aggregator';
import { computeGamificationReport } from '@/lib/analysis/gamification';
import { v4 as uuidv4 } from 'uuid';
import { saveReport, saveTransactions } from '@/lib/db/dexie';

export type AnalysisStep =
  | 'idle'
  | 'parsing'
  | 'categorizing'
  | 'analyzing'
  | 'generating-narrative'
  | 'done'
  | 'error';

export interface AnalysisProgress {
  step: AnalysisStep;
  message: string;
  percent: number;
}

export function useAnalysis() {
  const [progress, setProgress] = useState<AnalysisProgress>({
    step: 'idle',
    message: '',
    percent: 0,
  });
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = useCallback(
    async (
      rows: Record<string, string>[],
      mapping: ColumnMapping,
      options: { familyName: string; netWorth?: number; previousNetWorth?: number }
    ) => {
      setError(null);

      try {
        // Step 1: Parse
        setProgress({ step: 'parsing', message: 'Parsing your transactions...', percent: 5 });
        const transactions = normalizeTransactions(rows, mapping);
        if (transactions.length === 0) throw new Error('No valid transactions found');

        // Step 2: Local merchant lookup
        setProgress({ step: 'categorizing', message: 'Running merchant lookup...', percent: 15 });
        const preMatched: Transaction[] = [];
        const needsAI: Transaction[] = [];

        for (const t of transactions) {
          const result = merchantLookup(t.description);
          if (result) {
            preMatched.push({ ...t, ...result, id: t.id });
          } else {
            needsAI.push(t);
          }
        }

        // Step 3: AI categorization for unmatched
        let categorized = [...preMatched];
        if (needsAI.length > 0) {
          const batches = splitIntoBatches(needsAI, 50);
          for (let i = 0; i < batches.length; i++) {
            const pct = 15 + Math.round(((i + 1) / batches.length) * 40);
            setProgress({
              step: 'categorizing',
              message: `AI categorizing batch ${i + 1} of ${batches.length}...`,
              percent: pct,
            });

            try {
              const response = await fetch('/api/categorize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  transactions: batches[i].map((t) => ({
                    id: t.id,
                    description: t.description,
                    amount: t.amount,
                    type: t.type,
                  })),
                }),
              });

              if (response.ok) {
                const data = await response.json();
                categorized = [...categorized, ...applyCategorizationResults(batches[i], data.results)];
              } else {
                // Fallback: add with default category
                categorized = [...categorized, ...batches[i]];
              }
            } catch {
              categorized = [...categorized, ...batches[i]];
            }
          }
        }

        // Step 4: Analysis
        setProgress({ step: 'analyzing', message: 'Crunching the numbers...', percent: 60 });
        const totalIncome = getTotalIncome(categorized);
        const totalExpenses = getTotalExpenses(categorized);
        const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;
        const dates = categorized.map((t) => t.date).sort((a, b) => a.getTime() - b.getTime());
        const periodStart = dates[0] ?? new Date();
        const periodEnd = dates[dates.length - 1] ?? new Date();

        // AI habit detection
        setProgress({ step: 'analyzing', message: 'Detecting spending patterns...', percent: 70 });
        const partialReport = {
          totalIncome,
          totalExpenses,
          savingsRate,
          familyName: options.familyName,
          periodStart,
          periodEnd,
          currentNetWorth: options.netWorth ?? 0,
          netWorthChange: options.netWorth != null && options.previousNetWorth != null
            ? options.netWorth - options.previousNetWorth
            : 0,
        };

        let aiHabits: Partial<{ title: string; description: string; type: 'good' | 'bad' | 'neutral'; impact: 'high' | 'medium' | 'low'; icon: string }>[] = [];
        try {
          const habitsResponse = await fetch('/api/narrative', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ report: partialReport, type: 'habits' }),
          });
          if (habitsResponse.ok) {
            const habitsData = await habitsResponse.json();
            aiHabits = (habitsData.habits ?? []).map((h: Record<string, string>) => ({
              ...h,
              type: ['good', 'bad', 'neutral'].includes(h.type) ? h.type as 'good' | 'bad' | 'neutral' : 'neutral',
              impact: ['high', 'medium', 'low'].includes(h.impact) ? h.impact as 'high' | 'medium' | 'low' : 'medium',
            }));
          }
        } catch { /* non-critical */ }

        const categoryAnalyses = aggregateByCategory(categorized);
        const gamification = computeGamificationReport(
          categorized,
          categoryAnalyses,
          totalIncome,
          totalExpenses,
          aiHabits
        );

        // Step 5: Generate narrative
        setProgress({ step: 'generating-narrative', message: 'Your AI CFO is writing the presentation...', percent: 80 });
        const fullPartialReport = {
          ...partialReport,
          categoryAnalyses,
          gamification,
          transactions: categorized,
        };

        let narrative = {
          executiveSummary: 'A solid year of financial activity with notable patterns worth reviewing.',
          spendingStory: 'Spending was distributed across key lifestyle categories.',
          netWorthStory: 'Net worth remained stable throughout the period.',
          habitsStory: 'Several spending habits were identified for optimization.',
          recommendationsStory: '1. Review subscriptions. 2. Reduce dining spend. 3. Increase savings rate.',
          cfoSignOff: "Your AI CFO has reviewed the books — the future looks manageable. Let's keep building.",
        };

        try {
          const narrativeResponse = await fetch('/api/narrative', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ report: fullPartialReport }),
          });
          if (narrativeResponse.ok) {
            narrative = await narrativeResponse.json();
          }
        } catch { /* use default */ }

        setProgress({ step: 'done', message: 'Your CFO report is ready!', percent: 100 });

        const finalReport: AnalysisReport = {
          id: uuidv4(),
          generatedAt: new Date(),
          periodStart,
          periodEnd,
          familyName: options.familyName,
          transactions: categorized,
          categoryAnalyses,
          netWorthSnapshots: [],
          currentNetWorth: options.netWorth ?? 0,
          netWorthChange: partialReport.netWorthChange,
          totalIncome,
          totalExpenses,
          savingsRate,
          gamification,
          narrative,
          insights: [
            `Processed ${categorized.length} transactions over ${Math.round((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24 * 30))} months`,
            `${preMatched.length} transactions matched instantly, ${needsAI.length} categorized by AI`,
          ],
        };

        await saveTransactions(categorized);
        await saveReport(finalReport);
        setReport(finalReport);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Analysis failed';
        setError(msg);
        setProgress({ step: 'error', message: msg, percent: 0 });
      }
    },
    []
  );

  const reset = useCallback(() => {
    setReport(null);
    setError(null);
    setProgress({ step: 'idle', message: '', percent: 0 });
  }, []);

  return { progress, report, error, runAnalysis, reset };
}
