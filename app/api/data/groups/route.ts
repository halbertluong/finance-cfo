import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { dbLoadGroups, dbSaveGroup } from '@/lib/db/postgres';

export async function GET() {
  try {
    const userId = await requireUserId();
    const groups = await dbLoadGroups(userId);
    return NextResponse.json(groups);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const group = await req.json();
    await dbSaveGroup(userId, group);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 401 });
  }
}
