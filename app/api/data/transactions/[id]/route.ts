import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { dbUpdateTransactionCategory, dbUpdateTransactionGroup } from '@/lib/db/postgres';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const body = await req.json();
    if (body.categoryId !== undefined) {
      await dbUpdateTransactionCategory(userId, id, body.categoryId);
    }
    if ('groupId' in body) {
      await dbUpdateTransactionGroup(userId, id, body.groupId ?? null);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const status = String(e).includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: String(e) }, { status });
  }
}
