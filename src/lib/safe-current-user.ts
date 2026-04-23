import { getCurrentUser } from '@/server/auth/get-current-user';

/**
 * Home / marketing routes: never crash SSR if session DB lookup throws (schema drift,
 * misconfigured DATABASE_URL). Logs full detail for Vercel; user sees logged-out shell.
 */
function isNextDynamicServerUsage(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const digest = (err as { digest?: unknown }).digest;
  if (digest === 'DYNAMIC_SERVER_USAGE') return true;
  const msg =
    err instanceof Error ? err.message : String((err as Error)?.message ?? err);
  return msg.includes('Dynamic server usage');
}

export async function getCurrentUserOrNullOnFailure() {
  try {
    return await getCurrentUser();
  } catch (err) {
    if (isNextDynamicServerUsage(err)) {
      throw err;
    }
    const { logger } = await import('@/lib/logger');
    const { serializeUnknownError } =
      await import('@/lib/server-error-serialize');
    logger.error(
      {
        boundary: 'getCurrentUserOrNullOnFailure',
        ...serializeUnknownError(err),
      },
      'getCurrentUser threw; treating as anonymous for this render'
    );
    return null;
  }
}
