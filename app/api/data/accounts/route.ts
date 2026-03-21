import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { dbSaveAccount, dbLoadAccounts } from '@/lib/db/postgres';

export async function GET() {
  try {
    const userId = await requireUserId();
    return NextResponse.json(await dbLoadAccounts(userId));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const account = await req.json();
    await dbSaveAccount(userId, account);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 401 });
  }
}
