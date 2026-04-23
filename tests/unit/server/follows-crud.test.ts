import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/db/client', () => ({
  prisma: {
    userFollow: {
      findFirst: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/db/client';
import { createFollowForUsers } from '@/server/follows/create-follow';
import { isFollowing } from '@/server/follows/follow-queries';
import { removeFollowForUsers } from '@/server/follows/remove-follow';

describe('createFollowForUsers', () => {
  beforeEach(() => {
    vi.mocked(prisma.userFollow.create).mockReset();
  });

  it('creates edge with follower and followed', async () => {
    vi.mocked(prisma.userFollow.create).mockResolvedValue({
      id: 'f1',
    } as never);
    await createFollowForUsers('a', 'b');
    expect(prisma.userFollow.create).toHaveBeenCalledWith({
      data: { followerId: 'a', followedId: 'b' },
    });
  });
});

describe('isFollowing', () => {
  beforeEach(() => {
    vi.mocked(prisma.userFollow.findFirst).mockReset();
  });

  it('returns true when row exists', async () => {
    vi.mocked(prisma.userFollow.findFirst).mockResolvedValue({
      id: 'x',
    } as never);
    await expect(isFollowing('a', 'b')).resolves.toBe(true);
  });

  it('returns false when no row', async () => {
    vi.mocked(prisma.userFollow.findFirst).mockResolvedValue(null);
    await expect(isFollowing('a', 'b')).resolves.toBe(false);
  });
});

describe('removeFollowForUsers', () => {
  beforeEach(() => {
    vi.mocked(prisma.userFollow.deleteMany).mockReset();
  });

  it('returns true when one row deleted', async () => {
    vi.mocked(prisma.userFollow.deleteMany).mockResolvedValue({ count: 1 });
    await expect(removeFollowForUsers('a', 'b')).resolves.toBe(true);
  });

  it('returns false when no row', async () => {
    vi.mocked(prisma.userFollow.deleteMany).mockResolvedValue({ count: 0 });
    await expect(removeFollowForUsers('a', 'b')).resolves.toBe(false);
  });
});
