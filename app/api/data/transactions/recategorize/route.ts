import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { dbBulkRecategorize } from '@/lib/db/postgres';

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updates: { id: string; categoryId: string; subcategoryId?: string; normalizedMerchant: string; confidence: number }[] = body.updates ?? [];

    if (updates.length === 0) {
      return NextResponse.json({ saved: 0 });
    }

    await dbBulkRecategorize(userId, updates);
    return NextResponse.json({ saved: updates.length });
  } catch (error) {
    console.error('Recategorize save error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Save failed' },
      { status: 500 }
    );
  }
}
