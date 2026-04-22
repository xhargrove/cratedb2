import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/server/auth/constants';

/**
 * Fast path for anonymous users: no session cookie → skip loading `/dashboard`.
 * Full session validation (expiry, tampering, DB lookup) runs in Server Components via `requireUser` / `getCurrentUser`.
 */
export function middleware(request: NextRequest) {
  const hasCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  if (request.nextUrl.pathname.startsWith('/dashboard') && !hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
