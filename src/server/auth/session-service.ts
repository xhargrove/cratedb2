import { isTransientPgError, pgRetryDelayMs } from '@/db/transient-pg-error';
import type { Prisma } from '@/generated/prisma/client';
import { logger } from '@/lib/logger';
import { serializeUnknownError } from '@/lib/server-error-serialize';
import { SESSION_MAX_DAYS } from '@/server/auth/constants';

type SessionWithUser = Prisma.SessionGetPayload<{
  include: { user: { include: { profile: true } } };
}>;

export type SessionUser = SessionWithUser['user'];

/**
 * Result of resolving the opaque session cookie against Postgres.
 * `transient_backend_error` means retries were exhausted — not “invalid session”.
 */
export type SessionResolveResult =
  | { outcome: 'session'; user: SessionUser }
  | { outcome: 'not_found' }
  | { outcome: 'expired' }
  | { outcome: 'transient_backend_error' };

export async function createSession(userId: string): Promise<string> {
  const { prisma } = await import('@/db/client');
  const expiresAt = new Date(
    Date.now() + SESSION_MAX_DAYS * 24 * 60 * 60 * 1000
  );
  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt,
    },
  });
  return session.id;
}

export async function destroySession(sessionId: string): Promise<void> {
  const { prisma } = await import('@/db/client');
  try {
    await prisma.session.delete({ where: { id: sessionId } });
  } catch {
    /* idempotent logout */
  }
}

/**
 * Resolve session cookie token to user row, distinguishing invalid sessions from backend failures.
 */
export async function resolveSessionForToken(
  sessionId: string | undefined
): Promise<SessionResolveResult> {
  if (!sessionId) {
    return { outcome: 'not_found' };
  }

  const { prisma } = await import('@/db/client');

  let session: SessionWithUser | null = null;

  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          user: {
            include: { profile: true },
          },
        },
      });
      break;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      if (!isTransientPgError(message)) {
        logger.error(
          {
            auth_event: 'auth_session_lookup_fatal',
            attempt,
            ...serializeUnknownError(err),
          },
          'session lookup failed (non-transient) — will propagate to RSC'
        );
        throw err;
      }

      if (attempt < maxAttempts) {
        logger.warn(
          {
            auth_event: 'auth_session_lookup_retry',
            sessionIdPrefix: sessionId.slice(0, 8),
            attempt,
            err: message,
          },
          'session lookup transient DB failure; retrying'
        );
        await pgRetryDelayMs(attempt);
        continue;
      }

      logger.error(
        {
          auth_event: 'auth_session_lookup_error',
          sessionIdPrefix: sessionId.slice(0, 8),
          attempt,
          err: message,
        },
        'session lookup failed after retries (transient)'
      );
      return { outcome: 'transient_backend_error' };
    }
  }

  if (!session) {
    return { outcome: 'not_found' };
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return { outcome: 'expired' };
  }

  return { outcome: 'session', user: session.user };
}

/**
 * @deprecated Prefer {@link resolveSessionForToken}. Returns null for transient errors (lossy).
 */
export async function getUserForSessionToken(
  sessionId: string | undefined
): Promise<SessionUser | null> {
  const r = await resolveSessionForToken(sessionId);
  if (r.outcome === 'session') return r.user;
  return null;
}
