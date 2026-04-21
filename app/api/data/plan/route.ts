import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { dbLoadPlan, dbSavePlan } from '@/lib/db/postgres';

export async function GET() {
  try {
    const userId = await requireUserId();
    const plan = await dbLoadPlan(userId);
    return NextResponse.json(plan);
  } catch (e) {
    const status = String(e).includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: String(e) }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const plan = await req.json();
    await dbSavePlan(userId, plan);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const status = String(e).includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: String(e) }, { status });
  }
}
