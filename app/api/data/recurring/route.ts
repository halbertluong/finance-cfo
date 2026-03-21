import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { dbSaveRecurring, dbLoadRecurring } from '@/lib/db/postgres';

export async function GET() {
  try {
    const userId = await requireUserId();
    return NextResponse.json(await dbLoadRecurring(userId));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const item = await req.json();
    await dbSaveRecurring(userId, item);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 401 });
  }
}
