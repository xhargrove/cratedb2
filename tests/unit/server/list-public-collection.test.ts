import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/db/client', () => ({
  prisma: {
    collectionRecord: {
      findMany: vi.fn(),
    },
    profile: {
      findUnique: vi.fn(),
    },
  },
}));

import { COLLECTION_LIST_MAX } from '@/lib/collection-constants';
import { prisma } from '@/db/client';
import { listPublicCollectionForUser } from '@/server/records/list-public-collection';

describe('listPublicCollectionForUser', () => {
  beforeEach(() => {
    vi.mocked(prisma.profile.findUnique).mockReset();
    vi.mocked(prisma.collectionRecord.findMany).mockReset();
  });

  it('returns empty visible when collection is private', async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({
      collectionPublic: false,
    } as never);

    const out = await listPublicCollectionForUser('user1');
    expect(out).toEqual({ visible: false, records: [] });
    expect(prisma.collectionRecord.findMany).not.toHaveBeenCalled();
  });

  it('lists capped records when public', async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue({
      collectionPublic: true,
    } as never);
    vi.mocked(prisma.collectionRecord.findMany).mockResolvedValue([]);

    const out = await listPublicCollectionForUser('user1');
    expect(out.visible).toBe(true);
    expect(prisma.collectionRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: 'user1' },
        take: COLLECTION_LIST_MAX,
      })
    );
  });

  it('defaults to public when profile missing', async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.collectionRecord.findMany).mockResolvedValue([]);

    const out = await listPublicCollectionForUser('user1');
    expect(out.visible).toBe(true);
  });
});
