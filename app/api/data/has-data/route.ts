import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { dbHasAnyData } from '@/lib/db/postgres';

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const hasData = await dbHasAnyData(userId);
    return NextResponse.json({ hasData });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
