import { headers } from 'next/headers';

/**
 * Canonical site origin for absolute links (QR, emails).
 * Prefer `NEXT_PUBLIC_APP_URL` in production so scans work when the server
 * cannot infer the public hostname (e.g. some proxies).
 */
export async function resolvePublicAppOrigin(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto =
    h.get('x-forwarded-proto') ??
    (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  if (host) return `${proto}://${host}`;

  return 'http://localhost:3000';
}
