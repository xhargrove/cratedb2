/**
 * pg v8 + pg-connection-string v2 map `sslmode=require|prefer|verify-ca` like
 * `verify-full`, but future versions will follow libpq. Node then prints a loud
 * warning; Next.js also surfaces it in the browser console in dev.
 *
 * If the URL uses one of those legacy aliases without `uselibpqcompat=true`,
 * set `sslmode=verify-full` so behavior matches today's stack and the warning
 * stays in the terminal (or disappears).
 *
 * @see https://www.postgresql.org/docs/current/libpq-ssl.html
 */
export function normalizeDatabaseUrlForPgPool(urlString: string): string {
  let u: URL;
  try {
    u = new URL(urlString);
  } catch {
    return urlString;
  }

  const mode = u.searchParams.get('sslmode')?.toLowerCase() ?? '';
  if (!mode || u.searchParams.get('uselibpqcompat') === 'true') {
    return urlString;
  }

  if (!['require', 'prefer', 'verify-ca'].includes(mode)) {
    return urlString;
  }

  u.searchParams.set('sslmode', 'verify-full');
  return u.toString();
}
