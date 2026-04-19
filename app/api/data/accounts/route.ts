import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { dbSaveAccount, dbLoadAccounts } from '@/lib/db/postgres';

export async function GET() {
  try {
    const userId = await requireUserId();
    return NextResponse.json(await dbLoadAccounts(userId));
  } catch (e) {
    const status = String(e).includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: String(e) }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const account = await req.json();
    await dbSaveAccount(userId, account);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const status = String(e).includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: String(e) }, { status });
  }
}
