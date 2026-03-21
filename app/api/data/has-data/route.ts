import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { dbHasAnyData } from '@/lib/db/postgres';

export async function GET() {
  try {
    const userId = await requireUserId();
    const hasData = await dbHasAnyData(userId);
    return NextResponse.json({ hasData });
  } catch {
    return NextResponse.json({ hasData: false });
  }
}
