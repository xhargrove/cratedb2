import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/db/client', () => ({
  prisma: {
    collectionRecord: {
      groupBy: vi.fn(),
      count: vi.fn(),
    },
    collectionSingle: {
      aggregate: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    collectionTwelveInchSingle: {
      aggregate: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    wantlistItem: {
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

vi.mock('@/server/follows/follow-queries', () => ({
  getFollowCounts: vi.fn(),
}));

import { prisma } from '@/db/client';
import { getFollowCounts } from '@/server/follows/follow-queries';
import { getOwnerInsights } from '@/server/stats/get-owner-insights';

describe('getOwnerInsights', () => {
  beforeEach(() => {
    vi.mocked(prisma.wantlistItem.count).mockReset();
    vi.mocked(prisma.collectionRecord.count).mockReset();
    vi.mocked(prisma.collectionRecord.groupBy).mockReset();
    vi.mocked(prisma.collectionSingle.aggregate).mockReset();
    vi.mocked(prisma.collectionSingle.count).mockReset();
    vi.mocked(prisma.collectionSingle.groupBy).mockReset();
    vi.mocked(prisma.collectionTwelveInchSingle.aggregate).mockReset();
    vi.mocked(prisma.collectionTwelveInchSingle.count).mockReset();
    vi.mocked(prisma.collectionTwelveInchSingle.groupBy).mockReset();
    vi.mocked(prisma.$queryRaw).mockReset();
    vi.mocked(getFollowCounts).mockReset();
  });

  function mockSinglesEmpty() {
    vi.mocked(prisma.collectionSingle.aggregate).mockResolvedValue({
      _count: { _all: 0 },
      _sum: { quantity: null },
    } as never);
    vi.mocked(prisma.collectionSingle.count).mockResolvedValue(0);
    vi.mocked(prisma.collectionSingle.groupBy).mockResolvedValue([]);
  }

  function mockTwelveInchEmpty() {
    vi.mocked(prisma.collectionTwelveInchSingle.aggregate).mockResolvedValue({
      _count: { _all: 0 },
      _sum: { quantity: null },
    } as never);
    vi.mocked(prisma.collectionTwelveInchSingle.count).mockResolvedValue(0);
    vi.mocked(prisma.collectionTwelveInchSingle.groupBy).mockResolvedValue([]);
  }

  /** Routes distinct-artist counts across `records`, `collection_singles`, `collection_twelve_inch_singles`. */
  function mockDistinctArtistQueries(
    recordsDistinct: bigint,
    singlesDistinct: bigint,
    twelveInchDistinct: bigint
  ) {
    vi.mocked(prisma.$queryRaw).mockImplementation((async (...args: unknown[]) => {
      const parts = args[0];
      const sql =
        typeof parts === 'object' &&
        parts !== null &&
        Symbol.iterator in parts
          ? [...(parts as TemplateStringsArray)].join('')
          : '';
      if (sql.includes('collection_twelve_inch_singles')) {
        return [{ count: twelveInchDistinct }];
      }
      if (sql.includes('collection_singles')) {
        return [{ count: singlesDistinct }];
      }
      return [{ count: recordsDistinct }];
    }) as typeof prisma.$queryRaw);
  }

  it('computes artwork percent from artwork counts only', async () => {
    vi.mocked(prisma.wantlistItem.count).mockResolvedValue(0);
    mockDistinctArtistQueries(BigInt(1), BigInt(0), BigInt(0));
    vi.mocked(getFollowCounts).mockResolvedValue({
      followers: 0,
      following: 0,
    });
    vi.mocked(prisma.collectionRecord.count)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);
    vi.mocked(prisma.collectionRecord.groupBy).mockResolvedValue([]);
    mockSinglesEmpty();
    mockTwelveInchEmpty();

    const out = await getOwnerInsights('user-1');
    expect(out.recordCount).toBe(4);
    expect(out.artwork.withArtwork).toBe(2);
    expect(out.artwork.percentWithArtwork).toBe(50);
    expect(out.genres).toEqual([]);
    expect(out.artists).toEqual([]);
    expect(out.topReleaseYears).toEqual([]);
    expect(out.singleCount).toBe(0);
    expect(out.singlesTotalCopies).toBe(0);
    expect(out.singlesGenres).toEqual([]);
    expect(out.twelveInchCount).toBe(0);
    expect(out.twelveInchGenres).toEqual([]);
  });

  it('returns null percent when there are no records', async () => {
    vi.mocked(prisma.wantlistItem.count).mockResolvedValue(2);
    mockDistinctArtistQueries(BigInt(0), BigInt(0), BigInt(0));
    vi.mocked(getFollowCounts).mockResolvedValue({
      followers: 1,
      following: 3,
    });
    vi.mocked(prisma.collectionRecord.count)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    vi.mocked(prisma.collectionRecord.groupBy).mockResolvedValue([]);
    mockSinglesEmpty();
    mockTwelveInchEmpty();

    const out = await getOwnerInsights('empty-user');
    expect(out.recordCount).toBe(0);
    expect(out.wantlistCount).toBe(2);
    expect(out.artwork.percentWithArtwork).toBeNull();
    expect(out.follows).toEqual({ followers: 1, following: 3 });
  });

  it('applies bar widths to genre rows', async () => {
    vi.mocked(prisma.wantlistItem.count).mockResolvedValue(0);
    mockDistinctArtistQueries(BigInt(2), BigInt(0), BigInt(0));
    vi.mocked(getFollowCounts).mockResolvedValue({
      followers: 0,
      following: 0,
    });
    vi.mocked(prisma.collectionRecord.count)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(0);
    vi.mocked(prisma.collectionRecord.groupBy)
      .mockResolvedValueOnce([{ genre: 'Rock', _count: { _all: 2 } }] as never)
      .mockResolvedValueOnce([{ artist: 'X', _count: { _all: 2 } }] as never)
      .mockResolvedValueOnce([] as never);
    mockSinglesEmpty();
    mockTwelveInchEmpty();

    const out = await getOwnerInsights('u2');
    expect(out.genres).toEqual([{ label: 'Rock', count: 2, barPct: 100 }]);
    expect(out.artists[0]?.barPct).toBe(100);
  });

  it('includes singles aggregates when singles exist', async () => {
    vi.mocked(prisma.wantlistItem.count).mockResolvedValue(0);
    mockDistinctArtistQueries(BigInt(1), BigInt(2), BigInt(0));
    vi.mocked(getFollowCounts).mockResolvedValue({
      followers: 0,
      following: 0,
    });
    vi.mocked(prisma.collectionRecord.count)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    vi.mocked(prisma.collectionRecord.groupBy).mockResolvedValue([]);
    mockTwelveInchEmpty();
    vi.mocked(prisma.collectionSingle.aggregate).mockResolvedValue({
      _count: { _all: 2 },
      _sum: { quantity: 5 },
    } as never);
    vi.mocked(prisma.collectionSingle.count)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1);
    // Prisma 7 `groupBy` mock is stricter than the test needs; avoid fighting the full signature.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.collectionSingle.groupBy as any).mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (args: any) => {
        const top = Array.isArray(args.by) ? args.by[0] : args.by;
        const key = typeof top === 'string' ? top : undefined;
        if (key === 'genre')
          return [{ genre: 'Soul', _count: { _all: 2 } }];
        if (key === 'artist')
          return [{ artist: 'Diana', _count: { _all: 2 } }];
        if (key === 'year') return [{ year: 1972, _count: { _all: 2 } }];
        return [];
      }
    );

    const out = await getOwnerInsights('u-singles');
    expect(out.singleCount).toBe(2);
    expect(out.singlesTotalCopies).toBe(5);
    expect(out.singlesArtwork.percentWithArtwork).toBe(50);
    expect(out.singlesGenres[0]?.label).toBe('Soul');
    expect(out.distinctArtistsInSingles).toBe(2);
  });
});
