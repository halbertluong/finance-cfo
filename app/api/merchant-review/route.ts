import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import {
  buildMerchantReviewPrompt,
  MERCHANT_REVIEW_SYSTEM_PROMPT,
  MerchantReviewInput,
} from '@/lib/ai/prompts';
import { splitIntoBatches } from '@/lib/ai/categorizer';

const client = new Anthropic();

const MerchantReviewInputSchema = z.object({
  name: z.string(),
  samples: z.array(z.string()),
  avgAmount: z.number(),
  count: z.number(),
  firstSeen: z.string(),
  lastSeen: z.string(),
  currentCategoryId: z.string(),
});

const MerchantReviewResultSchema = z.object({
  name: z.string(),
  categoryId: z.string(),
  isRecurring: z.boolean(),
  merchantType: z.enum(['subscription', 'utility_bill', 'irregular_bill', 'variable_spend']),
  suggestedFrequency: z
    .enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'annual'])
    .nullable()
    .optional(),
  confidence: z.number().min(0).max(1),
});

const ResponseSchema = z.object({ results: z.array(MerchantReviewResultSchema) });

async function analyzeBatch(batch: MerchantReviewInput[]) {
  const prompt = buildMerchantReviewPrompt(batch);
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: MERCHANT_REVIEW_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in response');
  const parsed = ResponseSchema.parse(JSON.parse(jsonMatch[0]));
  return parsed.results;
}

export async function POST(req: NextRequest) {
  try { await requireUserId(); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
  try {
    const { merchants } = await req.json();

    if (!Array.isArray(merchants) || merchants.length === 0) {
      return NextResponse.json({ error: 'No merchants provided' }, { status: 400 });
    }

    const validated = z.array(MerchantReviewInputSchema).parse(merchants);

    const batches = splitIntoBatches(validated, 30);
    const allResults = [];
    for (const batch of batches) {
      const results = await analyzeBatch(batch);
      allResults.push(...results);
    }

    return NextResponse.json({ results: allResults });
  } catch (error) {
    console.error('Merchant review error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Merchant review failed' },
      { status: 500 }
    );
  }
}
