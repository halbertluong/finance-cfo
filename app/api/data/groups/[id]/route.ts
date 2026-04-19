import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { dbRemoveGroup } from '@/lib/db/postgres';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    await dbRemoveGroup(userId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const status = String(e).includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: String(e) }, { status });
  }
}
