import { Transaction, CategorizationResult } from '@/models/types';

const MERCHANT_LOOKUP: Record<string, { categoryId: string; subcategoryId: string; merchant: string; tags: string[] }> = {
  // Groceries
  'whole foods': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: 'Whole Foods', tags: ['grocery'] },
  'trader joe': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: "Trader Joe's", tags: ['grocery'] },
  'safeway': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: 'Safeway', tags: ['grocery'] },
  'kroger': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: 'Kroger', tags: ['grocery'] },
  'costco': { categoryId: 'groceries', subcategoryId: 'groceries-supermarket', merchant: 'Costco', tags: ['grocery', 'bulk'] },
  'target': { categoryId: 'shopping', subcategoryId: 'shopping-general', merchant: 'Target', tags: ['retail'] },
  'walmart': { categoryId: 'shopping', subcategoryId: 'shopping-general', merchant: 'Walmart', tags: ['retail'] },

  // Dining
  'starbucks': { categoryId: 'dining', subcategoryId: 'dining-coffee', merchant: 'Starbucks', tags: ['coffee', 'recurring'] },
  'dunkin': { categoryId: 'dining', subcategoryId: 'dining-coffee', merchant: "Dunkin'", tags: ['coffee'] },
  'mcdonald': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: "McDonald's", tags: ['fast-food'] },
  'chipotle': { categoryId: 'dining', subcategoryId: 'dining-fast-food', merchant: 'Chipotle', tags: ['fast-food'] },
  'doordash': { categoryId: 'dining', subcategoryId: 'dining-delivery', merchant: 'DoorDash', tags: ['delivery', 'food-delivery'] },
  'ubereats': { categoryId: 'dining', subcategoryId: 'dining-delivery', merchant: 'Uber Eats', tags: ['delivery', 'food-delivery'] },
  'grubhub': { categoryId: 'dining', subcategoryId: 'dining-delivery', merchant: 'Grubhub', tags: ['delivery', 'food-delivery'] },

  // Transportation
  'uber': { categoryId: 'transportation', subcategoryId: 'transport-rideshare', merchant: 'Uber', tags: ['rideshare'] },
  'lyft': { categoryId: 'transportation', subcategoryId: 'transport-rideshare', merchant: 'Lyft', tags: ['rideshare'] },
  'exxon': { categoryId: 'transportation', subcategoryId: 'transport-gas', merchant: 'Exxon', tags: ['gas'] },
  'shell': { categoryId: 'transportation', subcategoryId: 'transport-gas', merchant: 'Shell', tags: ['gas'] },
  'chevron': { categoryId: 'transportation', subcategoryId: 'transport-gas', merchant: 'Chevron', tags: ['gas'] },

  // Shopping
  'amazon': { categoryId: 'shopping', subcategoryId: 'shopping-amazon', merchant: 'Amazon', tags: ['online', 'amazon'] },
  'amzn': { categoryId: 'shopping', subcategoryId: 'shopping-amazon', merchant: 'Amazon', tags: ['online', 'amazon'] },
  'apple.com': { categoryId: 'shopping', subcategoryId: 'shopping-electronics', merchant: 'Apple', tags: ['electronics'] },
  'apple store': { categoryId: 'shopping', subcategoryId: 'shopping-electronics', merchant: 'Apple Store', tags: ['electronics'] },
  'best buy': { categoryId: 'shopping', subcategoryId: 'shopping-electronics', merchant: 'Best Buy', tags: ['electronics'] },

  // Entertainment / Subscriptions
  'netflix': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'Netflix', tags: ['streaming', 'subscription', 'recurring'] },
  'spotify': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'Spotify', tags: ['streaming', 'subscription', 'recurring'] },
  'hulu': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'Hulu', tags: ['streaming', 'subscription', 'recurring'] },
  'disney': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'Disney+', tags: ['streaming', 'subscription', 'recurring'] },
  'hbo': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'HBO Max', tags: ['streaming', 'subscription', 'recurring'] },
  'apple tv': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'Apple TV+', tags: ['streaming', 'subscription', 'recurring'] },
  'youtube premium': { categoryId: 'subscriptions', subcategoryId: 'subs-streaming', merchant: 'YouTube Premium', tags: ['streaming', 'subscription', 'recurring'] },
  'chatgpt': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'ChatGPT', tags: ['software', 'subscription', 'recurring'] },
  'openai': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'OpenAI', tags: ['software', 'subscription', 'recurring'] },
  'github': { categoryId: 'subscriptions', subcategoryId: 'subs-software', merchant: 'GitHub', tags: ['software', 'subscription', 'recurring'] },

  // Travel
  'airbnb': { categoryId: 'travel', subcategoryId: 'travel-hotels', merchant: 'Airbnb', tags: ['travel', 'lodging'] },
  'marriott': { categoryId: 'travel', subcategoryId: 'travel-hotels', merchant: 'Marriott', tags: ['travel', 'lodging'] },
  'hilton': { categoryId: 'travel', subcategoryId: 'travel-hotels', merchant: 'Hilton', tags: ['travel', 'lodging'] },
  'delta': { categoryId: 'travel', subcategoryId: 'travel-flights', merchant: 'Delta Airlines', tags: ['travel', 'flight'] },
  'united': { categoryId: 'travel', subcategoryId: 'travel-flights', merchant: 'United Airlines', tags: ['travel', 'flight'] },
  'american airlines': { categoryId: 'travel', subcategoryId: 'travel-flights', merchant: 'American Airlines', tags: ['travel', 'flight'] },
  'southwest': { categoryId: 'travel', subcategoryId: 'travel-flights', merchant: 'Southwest Airlines', tags: ['travel', 'flight'] },

  // Health
  'cvs': { categoryId: 'health', subcategoryId: 'health-pharmacy', merchant: 'CVS', tags: ['pharmacy'] },
  'walgreens': { categoryId: 'health', subcategoryId: 'health-pharmacy', merchant: 'Walgreens', tags: ['pharmacy'] },
  'planet fitness': { categoryId: 'health', subcategoryId: 'health-fitness', merchant: 'Planet Fitness', tags: ['gym', 'subscription', 'recurring'] },
  'equinox': { categoryId: 'health', subcategoryId: 'health-fitness', merchant: 'Equinox', tags: ['gym', 'subscription', 'recurring'] },
  'peloton': { categoryId: 'health', subcategoryId: 'health-fitness', merchant: 'Peloton', tags: ['fitness', 'subscription', 'recurring'] },

  // Transfers
  'venmo': { categoryId: 'transfer', subcategoryId: 'transfer-internal', merchant: 'Venmo', tags: ['transfer', 'p2p'] },
  'zelle': { categoryId: 'transfer', subcategoryId: 'transfer-internal', merchant: 'Zelle', tags: ['transfer', 'p2p'] },
  'paypal': { categoryId: 'transfer', subcategoryId: 'transfer-internal', merchant: 'PayPal', tags: ['transfer', 'p2p'] },
};

export function merchantLookup(description: string): CategorizationResult | null {
  const lower = description.toLowerCase();
  for (const [key, value] of Object.entries(MERCHANT_LOOKUP)) {
    if (lower.includes(key)) {
      return {
        id: '',
        categoryId: value.categoryId,
        subcategoryId: value.subcategoryId,
        normalizedMerchant: value.merchant,
        confidence: 0.95,
        tags: value.tags,
      };
    }
  }
  return null;
}

export function splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}

export function applyCategorizationResults(
  transactions: Transaction[],
  results: CategorizationResult[]
): Transaction[] {
  const resultMap = Object.fromEntries(results.map((r) => [r.id, r]));
  return transactions.map((t) => {
    const r = resultMap[t.id];
    if (!r) return t;
    return {
      ...t,
      categoryId: r.categoryId,
      subcategoryId: r.subcategoryId,
      normalizedMerchant: r.normalizedMerchant || t.description,
      confidence: r.confidence,
      tags: r.tags,
    };
  });
}
