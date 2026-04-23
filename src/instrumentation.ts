/**
 * Runs when the Next.js runtime loads `instrumentation` (dev may invoke more than once during Turbopack builds).
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

declare global {
  var __cratedbInstrumentationRegistered: boolean | undefined;
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  if (globalThis.__cratedbInstrumentationRegistered) return;

  const { getServerEnv } = await import('@/lib/env');
  // Fail fast during Node runtime startup if required env is missing/invalid.
  getServerEnv();

  globalThis.__cratedbInstrumentationRegistered = true;

  const { logger } = await import('@/lib/logger');
  logger.info('Cratedb server instrumentation loaded');
}
