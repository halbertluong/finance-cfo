import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { SESSION_COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { idToken } = await req.json();
  if (!idToken) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, decoded.uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    return res;
  } catch (e) {
    console.error('Session error:', String(e));
    return NextResponse.json({ error: String(e) }, { status: 401 });
  }
}
