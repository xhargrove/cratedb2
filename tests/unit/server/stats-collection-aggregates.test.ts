import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/db/client', () => ({
  prisma: {
    collectionRecord: {
      groupBy: vi.fn(),
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

import { prisma } from '@/db/client';
import {
  countDistinctArtistsForOwner,
  groupArtistsForOwner,
  groupGenresForOwner,
  groupYearsForOwner,
} from '@/server/stats/collection-aggregates';

describe('countDistinctArtistsForOwner', () => {
  beforeEach(() => {
    vi.mocked(prisma.$queryRaw).mockReset();
  });

  it('returns numeric count from raw query', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ count: BigInt(4) }]);
    await expect(countDistinctArtistsForOwner('owner-1')).resolves.toBe(4);
  });
});

describe('groupGenresForOwner', () => {
  beforeEach(() => {
    vi.mocked(prisma.collectionRecord.groupBy).mockReset();
  });

  it('scopes groupBy to ownerId', async () => {
    vi.mocked(prisma.collectionRecord.groupBy).mockResolvedValue([]);
    await groupGenresForOwner('owner-xyz');
    expect(prisma.collectionRecord.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: 'owner-xyz' },
      })
    );
  });

  it('sorts by count desc then label', async () => {
    vi.mocked(prisma.collectionRecord.groupBy).mockResolvedValue([
      {
        genre: null,
        _count: { _all: 1 },
      },
      {
        genre: 'Rock',
        _count: { _all: 3 },
      },
      {
        genre: 'Jazz',
        _count: { _all: 3 },
      },
    ] as never);
    const rows = await groupGenresForOwner('o1');
    expect(rows.map((r) => r.label)).toEqual(['Jazz', 'Rock', '(no genre)']);
    expect(rows.map((r) => r.count)).toEqual([3, 3, 1]);
  });
});

describe('groupArtistsForOwner', () => {
  beforeEach(() => {
    vi.mocked(prisma.collectionRecord.groupBy).mockReset();
  });

  it('uses (unknown artist) for blank artist', async () => {
    vi.mocked(prisma.collectionRecord.groupBy).mockResolvedValue([
      { artist: '   ', _count: { _all: 2 } },
    ] as never);
    const rows = await groupArtistsForOwner('o1');
    expect(rows[0]).toEqual({ label: '(unknown artist)', count: 2 });
  });

  it('scopes to ownerId', async () => {
    vi.mocked(prisma.collectionRecord.groupBy).mockResolvedValue([]);
    await groupArtistsForOwner('a99');
    expect(prisma.collectionRecord.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerId: 'a99' } })
    );
  });
});

describe('groupYearsForOwner', () => {
  beforeEach(() => {
    vi.mocked(prisma.collectionRecord.groupBy).mockReset();
  });

  it('excludes null years via where clause', async () => {
    vi.mocked(prisma.collectionRecord.groupBy).mockResolvedValue([]);
    await groupYearsForOwner('y1');
    expect(prisma.collectionRecord.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerId: 'y1', year: { not: null } },
      })
    );
  });
});
