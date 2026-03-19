import { Category } from '@/models/types';

export const CATEGORIES: Category[] = [
  {
    id: 'income',
    name: 'Income',
    icon: '💰',
    color: '#10b981',
    type: 'income',
    subcategories: [
      { id: 'income-salary', parentId: 'income', name: 'Salary & Wages' },
      { id: 'income-freelance', parentId: 'income', name: 'Freelance' },
      { id: 'income-investment', parentId: 'income', name: 'Investment Returns' },
      { id: 'income-other', parentId: 'income', name: 'Other Income' },
    ],
  },
  {
    id: 'housing',
    name: 'Housing',
    icon: '🏠',
    color: '#6366f1',
    type: 'essential',
    subcategories: [
      { id: 'housing-rent', parentId: 'housing', name: 'Rent / Mortgage' },
      { id: 'housing-utilities', parentId: 'housing', name: 'Utilities' },
      { id: 'housing-internet', parentId: 'housing', name: 'Internet & Phone' },
      { id: 'housing-maintenance', parentId: 'housing', name: 'Maintenance & Repairs' },
      { id: 'housing-insurance', parentId: 'housing', name: 'Home Insurance' },
    ],
  },
  {
    id: 'groceries',
    name: 'Groceries',
    icon: '🛒',
    color: '#84cc16',
    type: 'essential',
    subcategories: [
      { id: 'groceries-supermarket', parentId: 'groceries', name: 'Supermarket' },
      { id: 'groceries-specialty', parentId: 'groceries', name: 'Specialty Foods' },
      { id: 'groceries-farmers-market', parentId: 'groceries', name: "Farmer's Market" },
    ],
  },
  {
    id: 'dining',
    name: 'Dining & Restaurants',
    icon: '🍽️',
    color: '#f97316',
    type: 'discretionary',
    subcategories: [
      { id: 'dining-restaurants', parentId: 'dining', name: 'Restaurants' },
      { id: 'dining-coffee', parentId: 'dining', name: 'Coffee Shops' },
      { id: 'dining-fast-food', parentId: 'dining', name: 'Fast Food' },
      { id: 'dining-delivery', parentId: 'dining', name: 'Food Delivery' },
      { id: 'dining-bars', parentId: 'dining', name: 'Bars & Nightlife' },
    ],
  },
  {
    id: 'transportation',
    name: 'Transportation',
    icon: '🚗',
    color: '#3b82f6',
    type: 'essential',
    subcategories: [
      { id: 'transport-gas', parentId: 'transportation', name: 'Gas & Fuel' },
      { id: 'transport-rideshare', parentId: 'transportation', name: 'Rideshare & Taxi' },
      { id: 'transport-public', parentId: 'transportation', name: 'Public Transit' },
      { id: 'transport-parking', parentId: 'transportation', name: 'Parking & Tolls' },
      { id: 'transport-auto', parentId: 'transportation', name: 'Auto Insurance & Fees' },
    ],
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: '🛍️',
    color: '#ec4899',
    type: 'discretionary',
    subcategories: [
      { id: 'shopping-clothing', parentId: 'shopping', name: 'Clothing & Apparel' },
      { id: 'shopping-amazon', parentId: 'shopping', name: 'Amazon' },
      { id: 'shopping-electronics', parentId: 'shopping', name: 'Electronics' },
      { id: 'shopping-home', parentId: 'shopping', name: 'Home & Garden' },
      { id: 'shopping-general', parentId: 'shopping', name: 'General Shopping' },
    ],
  },
  {
    id: 'health',
    name: 'Health & Wellness',
    icon: '💪',
    color: '#14b8a6',
    type: 'essential',
    subcategories: [
      { id: 'health-medical', parentId: 'health', name: 'Medical & Dental' },
      { id: 'health-pharmacy', parentId: 'health', name: 'Pharmacy' },
      { id: 'health-fitness', parentId: 'health', name: 'Gym & Fitness' },
      { id: 'health-insurance', parentId: 'health', name: 'Health Insurance' },
    ],
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: '🎬',
    color: '#a855f7',
    type: 'discretionary',
    subcategories: [
      { id: 'entertainment-streaming', parentId: 'entertainment', name: 'Streaming Services' },
      { id: 'entertainment-events', parentId: 'entertainment', name: 'Events & Concerts' },
      { id: 'entertainment-sports', parentId: 'entertainment', name: 'Sports & Recreation' },
      { id: 'entertainment-games', parentId: 'entertainment', name: 'Games & Hobbies' },
    ],
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: '✈️',
    color: '#0ea5e9',
    type: 'discretionary',
    subcategories: [
      { id: 'travel-flights', parentId: 'travel', name: 'Flights' },
      { id: 'travel-hotels', parentId: 'travel', name: 'Hotels & Lodging' },
      { id: 'travel-car-rental', parentId: 'travel', name: 'Car Rental' },
      { id: 'travel-activities', parentId: 'travel', name: 'Activities & Tours' },
    ],
  },
  {
    id: 'subscriptions',
    name: 'Subscriptions',
    icon: '🔄',
    color: '#f59e0b',
    type: 'discretionary',
    subcategories: [
      { id: 'subs-streaming', parentId: 'subscriptions', name: 'Streaming & Media' },
      { id: 'subs-software', parentId: 'subscriptions', name: 'Software & Apps' },
      { id: 'subs-news', parentId: 'subscriptions', name: 'News & Magazines' },
      { id: 'subs-membership', parentId: 'subscriptions', name: 'Memberships' },
    ],
  },
  {
    id: 'savings',
    name: 'Savings & Investments',
    icon: '📈',
    color: '#059669',
    type: 'savings',
    subcategories: [
      { id: 'savings-401k', parentId: 'savings', name: '401k / Retirement' },
      { id: 'savings-brokerage', parentId: 'savings', name: 'Brokerage' },
      { id: 'savings-emergency', parentId: 'savings', name: 'Emergency Fund' },
      { id: 'savings-savings-account', parentId: 'savings', name: 'Savings Account' },
    ],
  },
  {
    id: 'education',
    name: 'Education',
    icon: '📚',
    color: '#8b5cf6',
    type: 'essential',
    subcategories: [
      { id: 'edu-tuition', parentId: 'education', name: 'Tuition & Fees' },
      { id: 'edu-books', parentId: 'education', name: 'Books & Supplies' },
      { id: 'edu-courses', parentId: 'education', name: 'Online Courses' },
    ],
  },
  {
    id: 'childcare',
    name: 'Kids & Family',
    icon: '👨‍👩‍👧‍👦',
    color: '#f43f5e',
    type: 'essential',
    subcategories: [
      { id: 'kids-childcare', parentId: 'childcare', name: 'Childcare' },
      { id: 'kids-activities', parentId: 'childcare', name: 'Activities & Sports' },
      { id: 'kids-supplies', parentId: 'childcare', name: 'Supplies & Gear' },
    ],
  },
  {
    id: 'pets',
    name: 'Pets',
    icon: '🐾',
    color: '#78716c',
    type: 'discretionary',
    subcategories: [
      { id: 'pets-food', parentId: 'pets', name: 'Pet Food & Supplies' },
      { id: 'pets-vet', parentId: 'pets', name: 'Veterinary' },
      { id: 'pets-grooming', parentId: 'pets', name: 'Grooming & Boarding' },
    ],
  },
  {
    id: 'transfer',
    name: 'Transfers',
    icon: '↔️',
    color: '#94a3b8',
    type: 'transfer',
    subcategories: [
      { id: 'transfer-internal', parentId: 'transfer', name: 'Internal Transfer' },
      { id: 'transfer-payment', parentId: 'transfer', name: 'Credit Card Payment' },
    ],
  },
  {
    id: 'other',
    name: 'Other',
    icon: '📦',
    color: '#64748b',
    type: 'discretionary',
    subcategories: [
      { id: 'other-misc', parentId: 'other', name: 'Miscellaneous' },
      { id: 'other-fees', parentId: 'other', name: 'Fees & Charges' },
    ],
  },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export function getCategoryColor(categoryId: string): string {
  return CATEGORY_MAP[categoryId]?.color ?? '#64748b';
}

export function getCategoryName(categoryId: string): string {
  return CATEGORY_MAP[categoryId]?.name ?? 'Other';
}

export function getCategoryIcon(categoryId: string): string {
  return CATEGORY_MAP[categoryId]?.icon ?? '📦';
}
