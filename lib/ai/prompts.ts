import { CATEGORIES } from '@/lib/categories';
import { Transaction } from '@/models/types';

export const CATEGORIZATION_SYSTEM_PROMPT = `You are an expert personal finance transaction categorizer.
Your job is to analyze bank/credit card transactions and assign them to the correct category.
You must return ONLY valid JSON — no markdown, no explanation, no extra text.
Be confident with well-known merchants. Use the provided category list strictly.`;

export function buildCategorizationPrompt(transactions: Pick<Transaction, 'id' | 'description' | 'amount' | 'type'>[]): string {
  const categoryList = CATEGORIES.map(c =>
    `${c.id} (${c.name}): ${c.subcategories.map(s => s.id).join(', ')}`
  ).join('\n');

  const txList = transactions.map(t =>
    `{"id":"${t.id}","desc":"${t.description.replace(/"/g, "'")}","amount":${t.amount},"type":"${t.type}"}`
  ).join('\n');

  return `Categorize these ${transactions.length} financial transactions.

CATEGORIES AVAILABLE:
${categoryList}

TRANSACTIONS:
${txList}

Return a JSON object with this exact shape:
{
  "results": [
    {
      "id": "<same transaction id>",
      "categoryId": "<category id from list above>",
      "subcategoryId": "<subcategory id, optional>",
      "normalizedMerchant": "<clean merchant name, e.g. 'Whole Foods' not 'WHOLE FOODS MKT #123'>",
      "confidence": <0.0 to 1.0>,
      "tags": ["<optional tags like 'recurring', 'essential', 'impulse', 'subscription'>"]
    }
  ]
}`;
}

export const ANALYSIS_SYSTEM_PROMPT = `You are a witty, insightful CFO presenting a family's financial state of the union.
Your tone is: professional but warm, data-driven but human, honest but encouraging.
You use light humor without being dismissive of real financial concerns.
You speak as "your AI CFO" — first person plural ("we", "our family").`;

export function buildNarrativePrompt(summaryData: string): string {
  return `Based on this family's financial data summary, write the narrative sections for their annual CFO presentation.

FINANCIAL DATA:
${summaryData}

Write these 6 narrative sections. Return ONLY a JSON object with these exact keys:
{
  "executiveSummary": "<2-3 sentences summarizing the year, key wins and concerns, overall trajectory>",
  "spendingStory": "<2-3 sentences telling the story of where money went, notable patterns, any surprises>",
  "netWorthStory": "<2-3 sentences on net worth trajectory, what drove changes, what it means for the future>",
  "habitsStory": "<2-3 sentences on behavioral patterns observed, both good and areas to watch>",
  "recommendationsStory": "<3 specific, actionable recommendations written as friendly CFO advice>",
  "cfoSignOff": "<1 witty, warm closing sentence from 'your AI CFO' — think memorable annual report closer>"
}`;
}

export interface MerchantReviewInput {
  name: string;
  samples: string[];
  avgAmount: number;
  count: number;
  firstSeen: string;
  lastSeen: string;
  currentCategoryId: string;
}

export interface MerchantReviewResult {
  name: string;
  categoryId: string;
  isRecurring: boolean;
  merchantType: 'subscription' | 'utility_bill' | 'irregular_bill' | 'variable_spend';
  suggestedFrequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual' | null;
  confidence: number;
}

export const MERCHANT_REVIEW_SYSTEM_PROMPT = `You are an expert personal finance analyst.
Classify merchant spending patterns — not individual transactions.
Focus on whether a merchant represents a recurring obligation or variable spending.
Return ONLY valid JSON — no markdown, no explanation.`;

export function buildMerchantReviewPrompt(merchants: MerchantReviewInput[]): string {
  const categoryList = CATEGORIES.map(c =>
    `${c.id} (${c.name}): ${c.subcategories.map(s => s.id).join(', ')}`
  ).join('\n');

  const merchantList = merchants.map(m =>
    `{"name":${JSON.stringify(m.name)},"samples":${JSON.stringify(m.samples)},"avg":${m.avgAmount.toFixed(2)},"count":${m.count},"first":"${m.firstSeen}","last":"${m.lastSeen}","cat":"${m.currentCategoryId}"}`
  ).join('\n');

  return `Classify these ${merchants.length} merchant spending patterns.

CATEGORIES AVAILABLE:
${categoryList}

MERCHANT CLASSIFICATION RULES:
- subscription: fixed amount, consistent interval (streaming, software, gym membership)
- utility_bill: monthly service with slight amount variation (electric, phone, internet, insurance)
- irregular_bill: periodic but infrequent obligations (annual fees, quarterly insurance, car registration)
- variable_spend: no clear recurring pattern — discretionary spending (restaurants, gas, Amazon, retail)

MERCHANTS:
${merchantList}

Return a JSON object with this exact shape:
{
  "results": [
    {
      "name": "<exact name from input>",
      "categoryId": "<category id from list above>",
      "isRecurring": true|false,
      "merchantType": "subscription|utility_bill|irregular_bill|variable_spend",
      "suggestedFrequency": "weekly|biweekly|monthly|quarterly|annual|null",
      "confidence": <0.0 to 1.0>
    }
  ]
}`;
}

export function buildHabitDetectionPrompt(aggregateSummary: string): string {
  return `Analyze this family's financial aggregate data and identify 2-3 non-obvious spending patterns or habits.

DATA:
${aggregateSummary}

Look for patterns like: timing of purchases relative to paydays, lifestyle inflation signals, recurring splurges,
category correlations, seasonal spending anomalies, or positive counter-intuitive behaviors.

Return ONLY JSON:
{
  "habits": [
    {
      "title": "<short habit name>",
      "description": "<one sentence explanation>",
      "type": "good|bad|neutral",
      "impact": "high|medium|low",
      "icon": "<single emoji>"
    }
  ]
}`;
}
