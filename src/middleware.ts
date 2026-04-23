import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/server/auth/constants';

function applySecurityHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (request.nextUrl.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return response;
}

/**
 * Fast path for anonymous users: no session cookie → skip loading `/dashboard`.
 * Full session validation (expiry, tampering, DB lookup) runs in Server Components via `resolveAuth` / `requireUser`. Cookie presence here is only a fast gate.
 */
export function middleware(request: NextRequest) {
  const hasCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  const dashboardReturn =
    request.nextUrl.pathname +
    (request.nextUrl.search ? request.nextUrl.search : '');

  if (request.nextUrl.pathname.startsWith('/dashboard') && !hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', dashboardReturn);
    return applySecurityHeaders(NextResponse.redirect(url), request);
  }

  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-crate-dashboard-path', dashboardReturn);
    return applySecurityHeaders(
      NextResponse.next({ request: { headers: requestHeaders } }),
      request
    );
  }

  return applySecurityHeaders(NextResponse.next(), request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
