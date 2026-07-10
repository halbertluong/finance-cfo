import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import {
  dbBulkRecategorize,
  dbGetDistinctNonManualDescriptions,
  dbRecategorizeByDescription,
} from '@/lib/db/postgres';
import { merchantLookup } from '@/lib/ai/categorizer';

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;

    // Server-side merchant lookup mode: fetch all descriptions, run lookup, update by description
    if (!body.updates && !body.descriptionUpdates) {
      const descriptions = await dbGetDistinctNonManualDescriptions(userId);
      const matches: { description: string; categoryId: string; subcategoryId?: string; normalizedMerchant: string; confidence: number }[] = [];
      const unmatchedDescriptions: string[] = [];

      for (const desc of descriptions) {
        const result = merchantLookup(desc);
        if (result) {
          matches.push({
            description: desc,
            categoryId: result.categoryId,
            subcategoryId: result.subcategoryId,
            normalizedMerchant: result.normalizedMerchant,
            confidence: result.confidence,
          });
        } else {
          unmatchedDescriptions.push(desc);
        }
      }

      const updated = await dbRecategorizeByDescription(userId, matches);
      return NextResponse.json({ updated, total: descriptions.length, unmatchedDescriptions });
    }

    // AI results by description
    if (body.descriptionUpdates && Array.isArray(body.descriptionUpdates)) {
      const updates = body.descriptionUpdates as { description: string; categoryId: string; subcategoryId?: string; normalizedMerchant: string; confidence: number }[];
      const saved = await dbRecategorizeByDescription(userId, updates);
      return NextResponse.json({ saved });
    }

    // Legacy: per-ID updates (used as fallback or for individual updates)
    if (body.updates && Array.isArray(body.updates)) {
      const updates = body.updates as { id: string; categoryId: string; subcategoryId?: string; normalizedMerchant: string; confidence: number }[];
      if (updates.length === 0) return NextResponse.json({ saved: 0 });
      const saved = await dbBulkRecategorize(userId, updates);
      return NextResponse.json({ saved });
    }

    return NextResponse.json({ saved: 0 });
  } catch (error) {
    console.error('Recategorize error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
