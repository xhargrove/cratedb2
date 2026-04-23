import { logger } from '@/lib/logger';

/** Patterns for flaky TCP / pool / hosted Postgres blips that usually succeed on retry. */
export function isTransientPgError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('server has closed the connection') ||
    m.includes('connection terminated unexpectedly') ||
    m.includes('connection terminated') ||
    m.includes('econnreset') ||
    m.includes('econnrefused') ||
    m.includes('etimedout') ||
    m.includes('enotfound') ||
    m.includes('socket hang up') ||
    m.includes('socket closed') ||
    m.includes('broken pipe') ||
    m.includes('connection closed') ||
    m.includes("can't reach database server") ||
    m.includes('too many connections') ||
    m.includes('the connection is closed') ||
    m.includes('no connection to the server') ||
    m.includes('57p01') || // admin shutdown
    /** Prisma + `pg` pool when a new checkout cannot connect in time */
    m.includes('timeout exceeded when trying to connect') ||
    m.includes('timeout expired when connecting') ||
    m.includes('connection timeout')
  );
}

export async function pgRetryDelayMs(attempt: number): Promise<void> {
  /** Cap raised so pooled checkout failures (waking Neon, etc.) get real breathing room */
  const ms = Math.min(2500, 75 * 2 ** (attempt - 1));
  await new Promise((r) => setTimeout(r, ms));
}

const DEFAULT_MAX_ATTEMPTS = 5;

/**
 * Retries an async operation when the failure looks like a transient Postgres / pool issue
 * (same signals as {@link isTransientPgError}). Use for read paths that should survive
 * brief network or cold-pool stalls.
 */
export async function runWithPgRetry<T>(
  fn: () => Promise<T>,
  options?: { maxAttempts?: number; label?: string }
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const label = options?.label ?? 'db';

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const message = err instanceof Error ? err.message : String(err);

      if (!isTransientPgError(message)) {
        throw err;
      }

      if (attempt < maxAttempts) {
        logger.warn(
          { attempt, maxAttempts, label, err: message },
          'transient DB failure; retrying'
        );
        await pgRetryDelayMs(attempt);
      }
    }
  }

  logger.error(
    { maxAttempts, label, err: lastErr },
    'transient DB failure; exhausted retries'
  );
  if (lastErr instanceof Error) {
    throw lastErr;
  }
  throw new Error(String(lastErr ?? 'database operation failed after retries'));
}
