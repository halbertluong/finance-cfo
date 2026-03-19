import { Transaction, GamificationReport, CategoryAnalysis, SpendingHabit, Achievement, Grade, GradeSimple } from '@/models/types';
import { CATEGORY_MAP } from '@/lib/categories';

export function computeGamificationReport(
  transactions: Transaction[],
  categoryAnalyses: CategoryAnalysis[],
  totalIncome: number,
  totalExpenses: number,
  aiHabits: Partial<SpendingHabit>[] = []
): GamificationReport {
  const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;
  const categoryScores = categoryAnalyses.map((ca) => scoreCategoryAnalysis(ca));

  // Assign scores back to category analyses
  for (let i = 0; i < categoryAnalyses.length; i++) {
    categoryAnalyses[i].score = categoryScores[i];
  }

  const ruleBasedHabits = detectRuleBasedHabits(transactions, savingsRate);
  const allHabits: SpendingHabit[] = [
    ...ruleBasedHabits,
    ...aiHabits.map((h, i) => ({
      id: `ai-habit-${i}`,
      type: (h.type ?? 'neutral') as SpendingHabit['type'],
      title: h.title ?? 'Pattern Detected',
      description: h.description ?? '',
      evidence: [],
      icon: h.icon ?? '🔍',
      impact: (h.impact ?? 'medium') as SpendingHabit['impact'],
    })),
  ];

  const goodHabits = allHabits.filter((h) => h.type === 'good');
  const badHabits = allHabits.filter((h) => h.type === 'bad');
  const achievements = detectAchievements(transactions, savingsRate, totalExpenses);
  const overallScore = computeOverallScore(savingsRate, transactions, totalExpenses, totalIncome);
  const grade = scoreToGrade(overallScore);
  const title = getScoreTitle(overallScore);

  return {
    overallScore,
    grade,
    title,
    categoryScores,
    goodHabits,
    badHabits,
    achievements,
  };
}

function scoreCategoryAnalysis(ca: CategoryAnalysis) {
  const cat = CATEGORY_MAP[ca.categoryId];
  let score = 70; // baseline

  // Trend bonus/penalty
  if (ca.trend === 'decreasing') score += 15;
  if (ca.trend === 'increasing') score -= 10;

  // Consistency bonus (low variance = good)
  const amounts = ca.monthlyBreakdown.map((m) => m.amount);
  if (amounts.length > 1) {
    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const variance = amounts.reduce((s, a) => s + Math.pow(a - avg, 2), 0) / amounts.length;
    const cv = avg > 0 ? Math.sqrt(variance) / avg : 0;
    if (cv < 0.15) score += 10;
    else if (cv > 0.5) score -= 10;
  }

  // Discretionary categories have higher bar
  if (cat?.type === 'discretionary') score -= 5;

  score = Math.max(0, Math.min(100, score));
  const grade = numericToLetterGrade(score);
  const badge = getCategoryBadge(ca.categoryId, score, ca.totalSpent);

  return {
    score,
    grade,
    badge,
    insight: getCategoryInsight(ca.categoryId, score, ca.trend, ca.totalSpent),
  };
}

function numericToLetterGrade(score: number): GradeSimple {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getCategoryBadge(categoryId: string, score: number, totalSpent: number): string | undefined {
  const badges: Record<string, string[]> = {
    dining: ['🍽️ Dining Diplomat', '☕ Caffeine Commander', '🍕 Pizza Philosopher'],
    shopping: ['🛍️ Retail Royalty', '📦 Package Patron', '🛒 Cart Connoisseur'],
    travel: ['✈️ Wanderlust Winner', '🗺️ Globe Trotter', '🏖️ Vacation Visionary'],
    entertainment: ['🎬 Entertainment Executive', '🎮 Leisure Legend', '🎵 Fun Fund Hero'],
    groceries: ['🥦 Grocery Guardian', '🌽 Pantry Pro', '🍎 Nutrition Navigator'],
    health: ['💪 Wellness Warrior', '🏃 Health Hero', '🧘 Vitality Victor'],
  };
  const options = badges[categoryId];
  if (!options) return undefined;
  return options[score >= 80 ? 0 : score >= 60 ? 1 : 2];
}

function getCategoryInsight(categoryId: string, score: number, trend: string, total: number): string {
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  const insights: Record<string, { good: string; bad: string }> = {
    dining: {
      good: `Your dining spend of ${fmt(total)} is impressively restrained. Your taste is refined, your budget even more so.`,
      bad: `At ${fmt(total)}, your restaurant tab could fund a small culinary school. Delicious? Yes. Financially strategic? Less so.`,
    },
    shopping: {
      good: `Shopping spend of ${fmt(total)} — disciplined and intentional. Your credit card thanks you.`,
      bad: `${fmt(total)} in shopping suggests a hobby that might need a budget. Your packages probably have their own zip code.`,
    },
    groceries: {
      good: `Grocery spend of ${fmt(total)} shows solid home-cooking discipline. Your kitchen is earning its keep.`,
      bad: `At ${fmt(total)}, you're either feeding a small village or testing every artisan cheese known to humanity.`,
    },
    travel: {
      good: `Travel spend of ${fmt(total)} — you've seen the world without breaking the bank. Efficient explorer.`,
      bad: `${fmt(total)} in travel is either spectacular memories or very comfortable airport lounges. Worth every penny? Only you know.`,
    },
    entertainment: {
      good: `Entertainment at ${fmt(total)} is well within reason. You enjoy life without the financial hangover.`,
      bad: `${fmt(total)} in entertainment — you're basically a one-person economy for the leisure industry.`,
    },
  };
  const cat = insights[categoryId];
  if (!cat) return score >= 70 ? `Solid management of this category at ${fmt(total)}.` : `${fmt(total)} spent — worth reviewing this category's trajectory.`;
  return score >= 70 ? cat.good : cat.bad;
}

function detectRuleBasedHabits(transactions: Transaction[], savingsRate: number): SpendingHabit[] {
  const habits: SpendingHabit[] = [];

  // Subscription creep
  const subscriptionTxs = transactions.filter((t) => t.tags.includes('subscription'));
  const uniqueSubscriptions = new Set(subscriptionTxs.map((t) => t.normalizedMerchant)).size;
  if (uniqueSubscriptions > 8) {
    habits.push({
      id: 'subscription-creep',
      type: 'bad',
      title: 'Subscription Overload',
      description: `You have ${uniqueSubscriptions} active subscriptions. At least 3 of them are probably forgotten.`,
      evidence: subscriptionTxs.map((t) => t.id),
      icon: '🔄',
      impact: 'medium',
    });
  } else if (uniqueSubscriptions > 0) {
    habits.push({
      id: 'subscription-managed',
      type: 'good',
      title: 'Subscription Discipline',
      description: `Only ${uniqueSubscriptions} subscriptions — you know what you're paying for.`,
      evidence: subscriptionTxs.map((t) => t.id),
      icon: '✅',
      impact: 'low',
    });
  }

  // Food delivery habit
  const deliveryTxs = transactions.filter((t) => t.tags.includes('food-delivery'));
  if (deliveryTxs.length > 20) {
    const total = deliveryTxs.reduce((s, t) => s + t.amount, 0);
    habits.push({
      id: 'delivery-dependency',
      type: 'bad',
      title: 'Delivery App Devotee',
      description: `${deliveryTxs.length} food delivery orders totaling $${total.toFixed(0)}. Your DoorDash driver knows your name.`,
      evidence: deliveryTxs.map((t) => t.id),
      icon: '🛵',
      impact: 'medium',
    });
  }

  // Amazon habit
  const amazonTxs = transactions.filter((t) => t.tags.includes('amazon'));
  if (amazonTxs.length > 15) {
    habits.push({
      id: 'amazon-dependency',
      type: 'neutral',
      title: 'Prime Enthusiast',
      description: `${amazonTxs.length} Amazon orders — the UPS driver is basically family at this point.`,
      evidence: amazonTxs.map((t) => t.id),
      icon: '📦',
      impact: 'low',
    });
  }

  // Savings rate
  if (savingsRate > 0.2) {
    habits.push({
      id: 'strong-saver',
      type: 'good',
      title: 'Committed Saver',
      description: `${(savingsRate * 100).toFixed(0)}% savings rate — you're building real wealth, not just spending it.`,
      evidence: [],
      icon: '💰',
      impact: 'high',
    });
  } else if (savingsRate < 0.05) {
    habits.push({
      id: 'low-savings',
      type: 'bad',
      title: 'Savings Gap',
      description: `Savings rate of ${(savingsRate * 100).toFixed(0)}% leaves little cushion. Worth prioritizing.`,
      evidence: [],
      icon: '⚠️',
      impact: 'high',
    });
  }

  return habits;
}

function detectAchievements(
  transactions: Transaction[],
  savingsRate: number,
  totalExpenses: number
): Achievement[] {
  const achievements: Achievement[] = [];
  const now = new Date();

  if (savingsRate > 0.2) {
    achievements.push({
      id: 'saver-20',
      name: '20% Savings Club',
      description: 'Maintained a savings rate over 20%',
      icon: '🏆',
      unlockedAt: now,
    });
  }

  const coffeeSpend = transactions
    .filter((t) => t.tags.includes('coffee'))
    .reduce((s, t) => s + t.amount, 0);
  if (coffeeSpend < 100) {
    achievements.push({
      id: 'coffee-frugal',
      name: 'Home Brew Hero',
      description: 'Kept coffee shop spending under $100',
      icon: '☕',
      unlockedAt: now,
    });
  }

  const deliveryCount = transactions.filter((t) => t.tags.includes('food-delivery')).length;
  if (deliveryCount === 0) {
    achievements.push({
      id: 'no-delivery',
      name: 'Home Chef Champion',
      description: 'Zero food delivery orders — you actually cook',
      icon: '👨‍🍳',
      unlockedAt: now,
    });
  }

  return achievements;
}

function computeOverallScore(
  savingsRate: number,
  transactions: Transaction[],
  totalExpenses: number,
  totalIncome: number
): number {
  let score = 500; // base

  // Savings rate (25% weight, up to 212 pts)
  if (savingsRate > 0.2) score += 212;
  else if (savingsRate > 0.1) score += 150;
  else if (savingsRate > 0) score += 75;
  else score -= 50;

  // Essential vs discretionary (20% weight, up to 170 pts)
  const essential = transactions
    .filter((t) => {
      const cat = CATEGORY_MAP[t.categoryId];
      return cat?.type === 'essential' && t.type === 'debit';
    })
    .reduce((s, t) => s + t.amount, 0);
  const essentialRatio = totalExpenses > 0 ? essential / totalExpenses : 0;
  if (essentialRatio < 0.6) score += 170;
  else if (essentialRatio < 0.75) score += 100;
  else score += 30;

  // Subscription creep penalty
  const uniqueSubs = new Set(
    transactions.filter((t) => t.tags.includes('subscription')).map((t) => t.normalizedMerchant)
  ).size;
  if (uniqueSubs > 10) score -= 50;
  else if (uniqueSubs > 6) score -= 20;

  return Math.max(300, Math.min(850, Math.round(score)));
}

function scoreToGrade(score: number): Grade {
  if (score >= 800) return 'A+';
  if (score >= 750) return 'A';
  if (score >= 700) return 'B+';
  if (score >= 650) return 'B';
  if (score >= 600) return 'C+';
  if (score >= 550) return 'C';
  if (score >= 500) return 'D';
  return 'F';
}

function getScoreTitle(score: number): string {
  if (score >= 800) return 'The Financial Virtuoso';
  if (score >= 750) return 'The Methodical Accumulator';
  if (score >= 700) return 'The Steady Climber';
  if (score >= 650) return 'The Pragmatic Spender';
  if (score >= 600) return 'The Balanced Balancer';
  if (score >= 550) return 'The Work in Progress';
  if (score >= 500) return 'The Optimistic Optimizer';
  return 'The Turnaround Story';
}
