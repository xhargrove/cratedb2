import { prisma } from '@/db/client';
import { isTransientPgError, pgRetryDelayMs } from '@/db/transient-pg-error';
import type { Prisma } from '@/generated/prisma/client';
import { logger } from '@/lib/logger';
import { SESSION_MAX_DAYS } from '@/server/auth/constants';

type SessionWithUser = Prisma.SessionGetPayload<{
  include: { user: { include: { profile: true } } };
}>;

export async function createSession(userId: string): Promise<string> {
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
  try {
    await prisma.session.delete({ where: { id: sessionId } });
  } catch {
    /* idempotent logout */
  }
}

/**
 * Resolve a session token to the owning user + profile, or null if invalid/expired.
 */
export async function getUserForSessionToken(sessionId: string | undefined) {
  if (!sessionId) return null;

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
        throw err;
      }

      if (attempt < maxAttempts) {
        logger.warn(
          { sessionId, err: message, attempt },
          'session lookup transient DB failure; retrying'
        );
        await pgRetryDelayMs(attempt);
        continue;
      }

      logger.error(
        { sessionId, err: message, attempt },
        'session lookup failed due to transient DB connection issue'
      );
      return null;
    }
  }

  if (!session) return null;

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.user;
}
