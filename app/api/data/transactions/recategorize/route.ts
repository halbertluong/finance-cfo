import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { dbLoadTransactions, dbBulkRecategorize } from '@/lib/db/postgres';
import { merchantLookup, splitIntoBatches } from '@/lib/ai/categorizer';
import Anthropic from '@anthropic-ai/sdk';
import { buildCategorizationPrompt, CATEGORIZATION_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { z } from 'zod';

export const maxDuration = 300;

const client = new Anthropic();

const ResponseSchema = z.object({
  results: z.array(z.object({
    id: z.string(),
    categoryId: z.string(),
    subcategoryId: z.string().optional(),
    normalizedMerchant: z.string(),
    confidence: z.number().min(0).max(1),
    tags: z.array(z.string()),
  })),
});

type CatUpdate = {
  id: string;
  categoryId: string;
  subcategoryId?: string;
  normalizedMerchant: string;
  confidence: number;
  tags: string[];
};

export async function POST() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const allTransactions = await dbLoadTransactions(userId);
    const toRecategorize = allTransactions.filter((t) => !t.isManualOverride);

    if (toRecategorize.length === 0) {
      return NextResponse.json({ updated: 0, lookupMatched: 0, aiCategorized: 0, total: allTransactions.length });
    }

    const lookupUpdates: CatUpdate[] = [];
    const needsAI: typeof toRecategorize = [];

    for (const tx of toRecategorize) {
      const result = merchantLookup(tx.description);
      if (result) {
        lookupUpdates.push({
          id: tx.id,
          categoryId: result.categoryId,
          subcategoryId: result.subcategoryId,
          normalizedMerchant: result.normalizedMerchant,
          confidence: result.confidence,
          tags: result.tags,
        });
      } else {
        needsAI.push(tx);
      }
    }

    // Save lookup results immediately — fast and safe
    await dbBulkRecategorize(userId, lookupUpdates);

    // AI categorization in batches, saving after each batch
    let aiCount = 0;
    if (needsAI.length > 0) {
      const batches = splitIntoBatches(needsAI, 20);
      for (const batch of batches) {
        try {
          const prompt = buildCategorizationPrompt(
            batch.map((t) => ({ id: t.id, description: t.description, amount: t.amount, type: t.type }))
          );
          const message = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 4096,
            system: CATEGORIZATION_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: prompt }],
          });
          const text = message.content[0].type === 'text' ? message.content[0].text : '';
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) continue;

          const validated = ResponseSchema.parse(JSON.parse(jsonMatch[0]));
          const batchUpdates: CatUpdate[] = validated.results.map((r) => ({
            id: r.id,
            categoryId: r.categoryId,
            subcategoryId: r.subcategoryId,
            normalizedMerchant: r.normalizedMerchant,
            confidence: r.confidence,
            tags: r.tags,
          }));

          await dbBulkRecategorize(userId, batchUpdates);
          aiCount += batchUpdates.length;
        } catch {
          // Skip failed batches — partial progress is better than nothing
        }
      }
    }

    return NextResponse.json({
      updated: lookupUpdates.length + aiCount,
      lookupMatched: lookupUpdates.length,
      aiCategorized: aiCount,
      total: allTransactions.length,
    });
  } catch (error) {
    console.error('Recategorize error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Recategorization failed' },
      { status: 500 }
    );
  }
}
