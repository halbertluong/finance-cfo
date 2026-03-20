import { NextRequest, NextResponse } from 'next/server';

const PASSWORD = process.env.SITE_PASSWORD;
const COOKIE = 'cfo_auth';

export function middleware(req: NextRequest) {
  // No password set = open access
  if (!PASSWORD) return NextResponse.next();

  // Allow API routes through (needed for categorization etc.)
  if (req.nextUrl.pathname.startsWith('/api')) return NextResponse.next();

  // Already authenticated
  if (req.cookies.get(COOKIE)?.value === PASSWORD) return NextResponse.next();

  // Login page itself
  if (req.nextUrl.pathname === '/login') return NextResponse.next();

  // Redirect to login
  return NextResponse.redirect(new URL('/login', req.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
