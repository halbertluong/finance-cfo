import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { dbSaveAccountBalance, dbLoadLatestBalances } from '@/lib/db/postgres';

export async function GET() {
  try {
    const userId = await requireUserId();
    return NextResponse.json(await dbLoadLatestBalances(userId));
  } catch (e) {
    const status = String(e).includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: String(e) }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const bal = await req.json();
    await dbSaveAccountBalance(userId, bal);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const status = String(e).includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: String(e) }, { status });
  }
}
