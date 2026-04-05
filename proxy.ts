import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'cfo_session';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static assets, API routes, and sign-in page through
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  // Check for session cookie
  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (!session) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
