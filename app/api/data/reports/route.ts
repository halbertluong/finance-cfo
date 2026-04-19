import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { dbSaveReport, dbLoadLatestReport } from '@/lib/db/postgres';

export async function GET() {
  try {
    const userId = await requireUserId();
    const report = await dbLoadLatestReport(userId);
    return NextResponse.json(report);
  } catch (e) {
    const status = String(e).includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: String(e) }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const report = await req.json();
    await dbSaveReport(userId, report);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const status = String(e).includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: String(e) }, { status });
  }
}
