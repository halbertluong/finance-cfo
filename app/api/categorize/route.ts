import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { buildCategorizationPrompt, CATEGORIZATION_SYSTEM_PROMPT } from '@/lib/ai/prompts';

const client = new Anthropic();

const CategorizationResultSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  subcategoryId: z.string().optional(),
  normalizedMerchant: z.string(),
  confidence: z.number().min(0).max(1),
  tags: z.array(z.string()),
});

const ResponseSchema = z.object({
  results: z.array(CategorizationResultSchema),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { transactions } = await req.json();

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions provided' }, { status: 400 });
    }

    const prompt = buildCategorizationPrompt(transactions);

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: CATEGORIZATION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = ResponseSchema.parse(parsed);

    return NextResponse.json(validated);
  } catch (error) {
    console.error('Categorization error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Categorization failed' },
      { status: 500 }
    );
  }
}
