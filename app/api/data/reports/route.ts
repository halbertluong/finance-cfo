import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { dbSaveReport, dbLoadLatestReport } from '@/lib/db/postgres';

export async function GET() {
  try {
    const userId = await requireUserId();
    const report = await dbLoadLatestReport(userId);
    return NextResponse.json(report);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const report = await req.json();
    await dbSaveReport(userId, report);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 401 });
  }
}
