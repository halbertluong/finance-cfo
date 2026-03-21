import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { dbSaveBudget, dbLoadBudgets } from '@/lib/db/postgres';

export async function GET() {
  try {
    const userId = await requireUserId();
    return NextResponse.json(await dbLoadBudgets(userId));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const budget = await req.json();
    await dbSaveBudget(userId, budget);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 401 });
  }
}
