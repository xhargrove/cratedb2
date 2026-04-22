import { prisma } from '@/db/client';
import { SESSION_MAX_DAYS } from '@/server/auth/constants';

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

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        include: { profile: true },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.user;
}
