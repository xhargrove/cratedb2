import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/db/client', () => ({
  prisma: {
    collectionRecord: {
      groupBy: vi.fn(),
      count: vi.fn(),
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
    vi.mocked(prisma.$queryRaw).mockReset();
    vi.mocked(getFollowCounts).mockReset();
  });

  it('computes artwork percent from artwork counts only', async () => {
    vi.mocked(prisma.wantlistItem.count).mockResolvedValue(0);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ count: BigInt(1) }]);
    vi.mocked(getFollowCounts).mockResolvedValue({
      followers: 0,
      following: 0,
    });
    vi.mocked(prisma.collectionRecord.count)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);
    vi.mocked(prisma.collectionRecord.groupBy).mockResolvedValue([]);

    const out = await getOwnerInsights('user-1');
    expect(out.recordCount).toBe(4);
    expect(out.artwork.withArtwork).toBe(2);
    expect(out.artwork.percentWithArtwork).toBe(50);
    expect(out.genres).toEqual([]);
    expect(out.artists).toEqual([]);
    expect(out.topReleaseYears).toEqual([]);
  });

  it('returns null percent when there are no records', async () => {
    vi.mocked(prisma.wantlistItem.count).mockResolvedValue(2);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ count: BigInt(0) }]);
    vi.mocked(getFollowCounts).mockResolvedValue({
      followers: 1,
      following: 3,
    });
    vi.mocked(prisma.collectionRecord.count)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    vi.mocked(prisma.collectionRecord.groupBy).mockResolvedValue([]);

    const out = await getOwnerInsights('empty-user');
    expect(out.recordCount).toBe(0);
    expect(out.wantlistCount).toBe(2);
    expect(out.artwork.percentWithArtwork).toBeNull();
    expect(out.follows).toEqual({ followers: 1, following: 3 });
  });

  it('applies bar widths to genre rows', async () => {
    vi.mocked(prisma.wantlistItem.count).mockResolvedValue(0);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ count: BigInt(2) }]);
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

    const out = await getOwnerInsights('u2');
    expect(out.genres).toEqual([{ label: 'Rock', count: 2, barPct: 100 }]);
    expect(out.artists[0]?.barPct).toBe(100);
  });
});
