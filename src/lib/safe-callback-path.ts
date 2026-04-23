const MAX_CALLBACK_LEN = 4096;

/** Synthetic base URL — only used to distinguish relative vs absolute user input. */
const CALLBACK_URL_BASE = 'https://cratedb-callback.invalid';

function isAllowedDashboardPathname(pathname: string): boolean {
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/');
}

/**
 * Validates a post-auth redirect target from user-controlled input (query or
 * form). Only same-app dashboard paths are allowed (blocks open redirects).
 *
 * Allows `?q=https://…` and other query values that contain `://`; only true
 * absolute URLs to other origins are rejected.
 */
export function parseDashboardCallbackPath(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const s = value.trim();
  if (!s || s.length > MAX_CALLBACK_LEN) return null;
  if (!s.startsWith('/dashboard')) return null;
  if (s.startsWith('//')) return null;
  if (s.includes('..')) return null;

  let u: URL;
  try {
    u = new URL(s, CALLBACK_URL_BASE);
  } catch {
    return null;
  }

  const baseOrigin = new URL(CALLBACK_URL_BASE).origin;
  if (u.origin !== baseOrigin) return null;
  if (!isAllowedDashboardPathname(u.pathname)) return null;

  return s;
}
