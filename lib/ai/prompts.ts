import { CATEGORIES } from '@/lib/categories';
import { Transaction } from '@/models/types';

export const CATEGORIZATION_SYSTEM_PROMPT = `You are an expert personal finance transaction categorizer with deep knowledge of bank statement formats.
Your job is to analyze raw bank/credit card transaction descriptions and assign them to the most specific correct category.

CRITICAL RULES:
1. NEVER use "other" unless the description is truly random noise with zero identifiable signal.
2. A specific guess is ALWAYS better than "other". If you're uncertain between two categories, pick the more likely one.
3. Bank descriptions are often garbled — decode them using the patterns below before giving up.
4. Return ONLY valid JSON — no markdown, no explanation, no extra text.

BANK DESCRIPTION DECODING GUIDE:
- "SQ *<NAME>" = Square POS payment → categorize by the merchant name after SQ*
- "TST* <NAME>" = Toast POS (restaurant) → dining
- "SP <NAME>" = Shopify merchant → categorize by merchant name
- "PP*<NAME>" or "PAYPAL *<NAME>" = PayPal payment → categorize by merchant name
- "AMZN*" or "AMAZON*" = Amazon purchase → shopping
- "WHOLEFDS" or "WFM" = Whole Foods → groceries
- "ORIG CO NAME:<NAME>" or "ACH DEBIT <NAME>" = bill payment → categorize by company name
- "ONLINE PMT" / "ONLINE PAYMENT" / "AUTOPAY" = credit card/bill payment → transfer
- "DIRECT DEPOSIT" / "ACH CREDIT" / "PAYROLL" = income
- "ATM WITHDRAWAL" / "ATM CASH" = cash withdrawal → other (miscellaneous)
- "INTEREST EARNED" / "INTEREST PAYMENT" = income (investment)
- "CHECK #<number>" = check payment → categorize by any available context or transfer
- "RECURRING" / "RECUR" in description = likely a subscription
- "VZWRLSS" = Verizon Wireless → housing (phone)
- "COMCAST" / "XFINITY" = internet → housing
- "NFLX" = Netflix → subscriptions
- "SPOTIFY" = Spotify → subscriptions
- Numbers/IDs at end of merchant name are location codes — ignore them for categorization`;

export function buildCategorizationPrompt(transactions: Pick<Transaction, 'id' | 'description' | 'amount' | 'type'>[]): string {
  const categoryGuide = [
    'income → salary/wages, direct deposits, ACH credits from employers, tax refunds, investment dividends',
    'housing → rent, mortgage payments, electric/gas/water utilities, internet, phone bills, home insurance, repairs',
    'groceries → supermarkets, wholesale clubs, specialty food stores, food delivery services (Instacart)',
    'dining → restaurants, coffee shops, fast food, food delivery apps (DoorDash/UberEats/Grubhub), bars',
    'transportation → gas stations, Uber/Lyft rideshare, auto insurance, car maintenance, parking, public transit, tolls',
    'shopping → Amazon, retail stores, clothing, electronics, home goods, online marketplaces',
    'health → doctor/dentist visits, hospitals, pharmacies (CVS/Walgreens), gym memberships, health insurance, therapy',
    'entertainment → movies, concerts, sports events, video games, recreational activities',
    'travel → flights, hotels, Airbnb, car rentals, travel booking sites',
    'subscriptions → streaming services (Netflix/Spotify/Hulu), software (Adobe/Microsoft), news, memberships',
    'savings → brokerage transfers, 401k contributions, savings account deposits, investment purchases',
    'education → tuition, online courses, textbooks, tutoring',
    'childcare → daycare, babysitting, kids activities, children clothing/supplies',
    'pets → pet food, vet bills, grooming, pet supplies',
    'transfer → credit card payments, bank-to-bank transfers, Venmo/Zelle/CashApp, PayPal transfers',
    'other → ONLY for truly unidentifiable transactions with zero useful signal',
  ].join('\n');

  const txList = transactions.map(t =>
    `{"id":"${t.id}","desc":"${t.description.replace(/"/g, "'")}","amount":${t.amount},"type":"${t.type}"}`
  ).join('\n');

  return `Categorize these ${transactions.length} financial transactions. Use the category guide to pick the BEST match.

CATEGORY GUIDE (categoryId → what belongs here):
${categoryGuide}

VALID CATEGORY IDs: ${CATEGORIES.map(c => c.id).join(', ')}

SUBCATEGORY IDs by category:
${CATEGORIES.map(c => `  ${c.id}: ${c.subcategories.map(s => s.id).join(', ')}`).join('\n')}

TRANSACTIONS:
${txList}

IMPORTANT:
- Decode garbled bank descriptions (SQ*, TST*, AMZN*, VZWRLSS, etc.) before categorizing
- "other" should be used for fewer than 5% of transactions — always try harder first
- For credit transactions (type=credit), prefer income or transfer categories
- Return every transaction id — do not skip any

Return a JSON object:
{
  "results": [
    {
      "id": "<same transaction id>",
      "categoryId": "<category id>",
      "subcategoryId": "<subcategory id>",
      "normalizedMerchant": "<clean readable merchant name, e.g. 'Whole Foods' not 'WHOLEFDS MKT #1532'>",
      "confidence": <0.0 to 1.0>,
      "tags": ["recurring"|"essential"|"subscription"|"impulse"|"transfer" — only applicable ones]
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
