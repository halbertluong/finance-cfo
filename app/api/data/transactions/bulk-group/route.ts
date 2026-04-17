import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { dbBulkUpdateTransactionGroup } from '@/lib/db/postgres';

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { txIds, groupId } = await req.json();
    if (!Array.isArray(txIds)) {
      return NextResponse.json({ error: 'txIds must be an array' }, { status: 400 });
    }
    await dbBulkUpdateTransactionGroup(userId, txIds, groupId ?? null);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 401 });
  }
}
