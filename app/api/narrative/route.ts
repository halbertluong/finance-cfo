import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { buildNarrativePrompt, buildHabitDetectionPrompt, ANALYSIS_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { AnalysisReport } from '@/models/types';

const client = new Anthropic();

const NarrativeSchema = z.object({
  executiveSummary: z.string(),
  spendingStory: z.string(),
  netWorthStory: z.string(),
  habitsStory: z.string(),
  recommendationsStory: z.string(),
  cfoSignOff: z.string(),
});

const HabitSchema = z.object({
  habits: z.array(z.object({
    title: z.string(),
    description: z.string(),
    type: z.enum(['good', 'bad', 'neutral']),
    impact: z.enum(['high', 'medium', 'low']),
    icon: z.string(),
  })),
});

function buildSummaryData(report: Partial<AnalysisReport>): string {
  const fmt = (n: number) => `$${(n ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  const pct = (n: number) => `${((n ?? 0) * 100).toFixed(1)}%`;

  const topCategories = (report.categoryAnalyses ?? [])
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5)
    .map((ca) => `  - Category ${ca.categoryId}: ${fmt(ca.totalSpent)} (${ca.percentOfTotal.toFixed(1)}%, trend: ${ca.trend})`)
    .join('\n');

  return `
Family: ${report.familyName ?? 'The Family'}
Period: ${report.periodStart?.toLocaleDateString() ?? 'Unknown'} to ${report.periodEnd?.toLocaleDateString() ?? 'Unknown'}
Total Income: ${fmt(report.totalIncome ?? 0)}
Total Expenses: ${fmt(report.totalExpenses ?? 0)}
Savings Rate: ${pct(report.savingsRate ?? 0)}
Net Worth: ${fmt(report.currentNetWorth ?? 0)}
Net Worth Change: ${fmt(report.netWorthChange ?? 0)}
CFO Score: ${report.gamification?.overallScore ?? 0}/850 (${report.gamification?.grade ?? 'N/A'}) — "${report.gamification?.title ?? ''}"
Top Spending Categories:
${topCategories}
Good Habits Detected: ${(report.gamification?.goodHabits ?? []).map((h) => h.title).join(', ') || 'None identified'}
Habits to Watch: ${(report.gamification?.badHabits ?? []).map((h) => h.title).join(', ') || 'None identified'}
  `.trim();
}

export async function POST(req: NextRequest) {
  try { await requireUserId(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  try {
    const { report, type } = await req.json();

    const summaryData = buildSummaryData(report);

    if (type === 'habits') {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: ANALYSIS_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildHabitDetectionPrompt(summaryData) }],
      });
      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in habits response');
      const validated = HabitSchema.parse(JSON.parse(jsonMatch[0]));
      return NextResponse.json(validated);
    }

    // Default: narrative
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildNarrativePrompt(summaryData) }],
    });
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in narrative response');
    const validated = NarrativeSchema.parse(JSON.parse(jsonMatch[0]));
    return NextResponse.json(validated);
  } catch (error) {
    console.error('Narrative error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Narrative generation failed' },
      { status: 500 }
    );
  }
}
