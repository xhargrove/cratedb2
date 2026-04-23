import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/db/client', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { prisma } from '@/db/client';
import {
  createSession,
  destroySession,
  getUserForSessionToken,
} from '@/server/auth/session-service';

describe('session-service', () => {
  beforeEach(() => {
    vi.mocked(prisma.session.findUnique).mockReset();
    vi.mocked(prisma.session.delete).mockReset();
    vi.mocked(prisma.session.create).mockReset();
  });

  it('returns null without token', async () => {
    await expect(getUserForSessionToken(undefined)).resolves.toBeNull();
  });

  it('returns user when session is valid', async () => {
    const expiresAt = new Date(Date.now() + 86_400_000);
    vi.mocked(prisma.session.findUnique).mockResolvedValue({
      id: 'sess1',
      userId: 'u1',
      expiresAt,
      createdAt: new Date(),
      user: {
        id: 'u1',
        email: 'x@y.com',
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: null,
      },
    } as never);

    const user = await getUserForSessionToken('sess1');
    expect(user?.email).toBe('x@y.com');
    expect(prisma.session.delete).not.toHaveBeenCalled();
  });

  it('deletes expired session and returns null', async () => {
    const expiresAt = new Date(Date.now() - 1000);
    vi.mocked(prisma.session.findUnique).mockResolvedValue({
      id: 'sess1',
      userId: 'u1',
      expiresAt,
      createdAt: new Date(),
      user: {
        id: 'u1',
        email: 'x@y.com',
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: null,
      },
    } as never);
    vi.mocked(prisma.session.delete).mockResolvedValue({} as never);

    await expect(getUserForSessionToken('sess1')).resolves.toBeNull();
    expect(prisma.session.delete).toHaveBeenCalledWith({
      where: { id: 'sess1' },
    });
  });

  it('retries once on transient connection failure', async () => {
    const expiresAt = new Date(Date.now() + 86_400_000);
    vi.mocked(prisma.session.findUnique)
      .mockRejectedValueOnce(new Error('Server has closed the connection.'))
      .mockResolvedValueOnce({
        id: 'sess1',
        userId: 'u1',
        expiresAt,
        createdAt: new Date(),
        user: {
          id: 'u1',
          email: 'x@y.com',
          passwordHash: 'hash',
          createdAt: new Date(),
          updatedAt: new Date(),
          profile: null,
        },
      } as never);

    const user = await getUserForSessionToken('sess1');
    expect(user?.id).toBe('u1');
    expect(prisma.session.findUnique).toHaveBeenCalledTimes(2);
  });

  it('createSession persists session', async () => {
    vi.mocked(prisma.session.create).mockResolvedValue({
      id: 'new-sess',
      userId: 'u1',
      expiresAt: new Date(),
      createdAt: new Date(),
    } as never);

    const id = await createSession('u1');
    expect(id).toBe('new-sess');
    expect(prisma.session.create).toHaveBeenCalled();
  });

  it('destroySession deletes by id', async () => {
    vi.mocked(prisma.session.delete).mockResolvedValue({} as never);
    await destroySession('sid');
    expect(prisma.session.delete).toHaveBeenCalledWith({
      where: { id: 'sid' },
    });
  });
});
