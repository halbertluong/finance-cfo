import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { dbSaveGoal, dbLoadGoals } from '@/lib/db/postgres';

export async function GET() {
  try {
    const userId = await requireUserId();
    return NextResponse.json(await dbLoadGoals(userId));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const goal = await req.json();
    await dbSaveGoal(userId, goal);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 401 });
  }
}
