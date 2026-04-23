import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/db/client', () => ({
  prisma: {
    wantlistItem: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    collectionRecord: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/db/client';
import { userAlreadyOwnsEquivalentRelease } from '@/server/wantlist/already-owned';
import { createWantlistItemForOwner } from '@/server/wantlist/create';
import { deleteWantlistItemForOwner } from '@/server/wantlist/delete';
import { listWantlistItemsForOwner } from '@/server/wantlist/list-for-owner';
import { updateWantlistItemForOwner } from '@/server/wantlist/update';

describe('userAlreadyOwnsEquivalentRelease', () => {
  beforeEach(() => {
    vi.mocked(prisma.collectionRecord.findMany).mockReset();
  });

  it('returns true when a collection row matches dedupe identity', async () => {
    vi.mocked(prisma.collectionRecord.findMany).mockResolvedValue([
      {
        artist: '  Nina Simone ',
        title: 'Pastel Blues',
        year: 1965,
      },
    ] as never);

    const ok = await userAlreadyOwnsEquivalentRelease(
      'u1',
      'nina simone',
      'Pastel Blues',
      1965
    );
    expect(ok).toBe(true);
  });

  it('returns false when collection is empty', async () => {
    vi.mocked(prisma.collectionRecord.findMany).mockResolvedValue([]);
    const ok = await userAlreadyOwnsEquivalentRelease('u1', 'a', 'b', null);
    expect(ok).toBe(false);
  });
});

describe('createWantlistItemForOwner', () => {
  beforeEach(() => {
    vi.mocked(prisma.wantlistItem.create).mockReset();
  });

  it('persists dedupeKey from normalized fields', async () => {
    vi.mocked(prisma.wantlistItem.create).mockResolvedValue({
      id: 'w1',
    } as never);
    await createWantlistItemForOwner('u1', {
      artist: 'A',
      title: 'B',
      year: 2001,
      genre: undefined,
      notes: undefined,
    });
    expect(prisma.wantlistItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ownerId: 'u1',
        artist: 'A',
        title: 'B',
        year: 2001,
        dedupeKey: expect.any(String),
      }),
    });
  });
});

describe('listWantlistItemsForOwner', () => {
  beforeEach(() => {
    vi.mocked(prisma.wantlistItem.findMany).mockReset();
  });

  it('scopes and orders by newest first', async () => {
    vi.mocked(prisma.wantlistItem.findMany).mockResolvedValue([]);
    await listWantlistItemsForOwner('u1');
    expect(prisma.wantlistItem.findMany).toHaveBeenCalledWith({
      where: { ownerId: 'u1' },
      orderBy: { createdAt: 'desc' },
    });
  });
});

describe('updateWantlistItemForOwner', () => {
  beforeEach(() => {
    vi.mocked(prisma.wantlistItem.updateMany).mockReset();
  });

  it('scopes update to id and ownerId', async () => {
    vi.mocked(prisma.wantlistItem.updateMany).mockResolvedValue({ count: 1 });
    const ok = await updateWantlistItemForOwner('w1', 'u1', {
      artist: 'A',
      title: 'B',
      year: undefined,
      genre: undefined,
      notes: undefined,
    });
    expect(ok).toBe(true);
    expect(prisma.wantlistItem.updateMany).toHaveBeenCalledWith({
      where: { id: 'w1', ownerId: 'u1' },
      data: expect.objectContaining({
        artist: 'A',
        title: 'B',
        dedupeKey: expect.any(String),
      }),
    });
  });
});

describe('deleteWantlistItemForOwner', () => {
  beforeEach(() => {
    vi.mocked(prisma.wantlistItem.deleteMany).mockReset();
  });

  it('deletes only compound id + ownerId', async () => {
    vi.mocked(prisma.wantlistItem.deleteMany).mockResolvedValue({ count: 1 });
    const ok = await deleteWantlistItemForOwner('w1', 'u1');
    expect(ok).toBe(true);
    expect(prisma.wantlistItem.deleteMany).toHaveBeenCalledWith({
      where: { id: 'w1', ownerId: 'u1' },
    });
  });
});
