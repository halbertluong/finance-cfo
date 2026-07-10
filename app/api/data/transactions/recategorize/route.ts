import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { dbLoadTransactions, dbSaveTransactions } from '@/lib/db/postgres';
import { merchantLookup, splitIntoBatches } from '@/lib/ai/categorizer';
import Anthropic from '@anthropic-ai/sdk';
import { buildCategorizationPrompt, CATEGORIZATION_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { Transaction } from '@/models/types';
import { z } from 'zod';

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

    const lookupMatched: Transaction[] = [];
    const needsAI: Transaction[] = [];

    for (const tx of toRecategorize) {
      const result = merchantLookup(tx.description);
      if (result) {
        lookupMatched.push({
          ...tx,
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

    const aiUpdated: Transaction[] = [];
    if (needsAI.length > 0) {
      const batches = splitIntoBatches(needsAI, 25);
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
          if (jsonMatch) {
            const validated = ResponseSchema.parse(JSON.parse(jsonMatch[0]));
            const resultMap = Object.fromEntries(validated.results.map((r) => [r.id, r]));
            for (const tx of batch) {
              const r = resultMap[tx.id];
              aiUpdated.push(r ? {
                ...tx,
                categoryId: r.categoryId,
                subcategoryId: r.subcategoryId,
                normalizedMerchant: r.normalizedMerchant || tx.description,
                confidence: r.confidence,
                tags: r.tags,
              } : tx);
            }
          } else {
            aiUpdated.push(...batch);
          }
        } catch {
          aiUpdated.push(...batch);
        }
      }
    }

    const toSave = [...lookupMatched, ...aiUpdated];
    await dbSaveTransactions(userId, toSave);

    return NextResponse.json({
      updated: toSave.length,
      lookupMatched: lookupMatched.length,
      aiCategorized: aiUpdated.length,
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
