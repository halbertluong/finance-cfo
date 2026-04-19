import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { dbSaveTransactions, dbLoadTransactions } from '@/lib/db/postgres';

export async function GET() {
  try {
    const userId = await requireUserId();
    const transactions = await dbLoadTransactions(userId);
    return NextResponse.json(transactions);
  } catch (e) {
    const status = String(e).includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: String(e) }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { transactions } = await req.json();
    await dbSaveTransactions(userId, transactions);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const status = String(e).includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: String(e) }, { status });
  }
}
