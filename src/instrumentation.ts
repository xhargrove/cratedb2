/**
 * Runs when the Next.js runtime loads `instrumentation` (dev may invoke more than once during Turbopack builds).
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import type { Instrumentation } from 'next';

declare global {
  var __cratedbInstrumentationRegistered: boolean | undefined;
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  if (globalThis.__cratedbInstrumentationRegistered) return;

  const { getServerEnv } = await import('@/lib/env');
  // Fail fast during Node runtime startup if required env is missing/invalid.
  const serverEnv = getServerEnv();

  globalThis.__cratedbInstrumentationRegistered = true;

  const { logger } = await import('@/lib/logger');
  logger.info('Cratedb server instrumentation loaded');

  if (
    process.env.NODE_ENV === 'production' &&
    serverEnv.ARTWORK_STORAGE_BACKEND === 'local'
  ) {
    logger.warn(
      {
        cratedb_event: 'artwork_storage_local_in_production',
        vercel: process.env.VERCEL === '1',
      },
      'ARTWORK_STORAGE_BACKEND is local in production. Artwork files are written to the app disk; on serverless hosts this is ephemeral and not shared across instances — configure S3 (see docs/DEPLOYMENT.md § Artwork storage).'
    );
  }
}

/**
 * Full server-side error + request context (path, route module, RSC vs route handler).
 * Production browser still hides messages; Vercel runtime logs show this payload.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  errorRequest,
  errorContext
) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { logger } = await import('@/lib/logger');
  const { serializeUnknownError } =
    await import('@/lib/server-error-serialize');

  const serialized = serializeUnknownError(error);

  logger.error(
    {
      cratedb_event: 'next_on_request_error',
      ...serialized,
      requestPath: errorRequest.path,
      requestMethod: errorRequest.method,
      routePath: errorContext.routePath,
      routeType: errorContext.routeType,
      renderSource: errorContext.renderSource,
      routerKind: errorContext.routerKind,
      revalidateReason: errorContext.revalidateReason,
    },
    'Next.js captured server error (see routePath + category)'
  );
};
