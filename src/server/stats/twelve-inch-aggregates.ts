import { prisma } from '@/db/client';

import {
  STATS_TOP_ARTISTS,
  STATS_TOP_GENRES,
  STATS_TOP_YEARS,
} from '@/server/stats/constants';
import { genreLabel } from '@/server/stats/labels';

function countFromGroup<T extends { _count: { _all: number } }>(
  row: T
): number {
  return row._count._all;
}

export async function countDistinctTwelveInchArtistsForOwner(
  ownerId: string
): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(DISTINCT artist)::bigint AS count
    FROM collection_twelve_inch_singles
    WHERE "ownerId" = ${ownerId}
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function twelveInchArtworkCountsForOwner(ownerId: string): Promise<{
  total: number;
  withArtwork: number;
}> {
  const [total, withArtwork] = await Promise.all([
    prisma.collectionTwelveInchSingle.count({ where: { ownerId } }),
    prisma.collectionTwelveInchSingle.count({
      where: { ownerId, artworkKey: { not: null } },
    }),
  ]);
  return { total, withArtwork };
}

export async function twelveInchCountsForOwner(ownerId: string): Promise<{
  rowCount: number;
  totalCopies: number;
}> {
  const agg = await prisma.collectionTwelveInchSingle.aggregate({
    where: { ownerId },
    _sum: { quantity: true },
    _count: { _all: true },
  });
  return {
    rowCount: agg._count._all,
    totalCopies: agg._sum.quantity ?? 0,
  };
}

export async function groupTwelveInchGenresForOwner(
  ownerId: string
): Promise<Array<{ label: string; count: number }>> {
  const rows = await prisma.collectionTwelveInchSingle.groupBy({
    by: ['genre'],
    where: { ownerId },
    _count: { _all: true },
    orderBy: { _count: { genre: 'desc' } },
    take: STATS_TOP_GENRES,
  });

  const ranked = rows.map((r) => ({
    label: genreLabel(r.genre),
    count: countFromGroup(r),
  }));

  ranked.sort((a, b) => {
    const d = b.count - a.count;
    if (d !== 0) return d;
    return a.label.localeCompare(b.label);
  });

  return ranked.slice(0, STATS_TOP_GENRES);
}

export async function groupTwelveInchArtistsForOwner(
  ownerId: string
): Promise<Array<{ label: string; count: number }>> {
  const rows = await prisma.collectionTwelveInchSingle.groupBy({
    by: ['artist'],
    where: { ownerId },
    _count: { _all: true },
    orderBy: { _count: { artist: 'desc' } },
    take: STATS_TOP_ARTISTS,
  });

  const ranked = rows.map((r) => ({
    label: r.artist.trim() || '(unknown artist)',
    count: countFromGroup(r),
  }));

  ranked.sort((a, b) => {
    const d = b.count - a.count;
    if (d !== 0) return d;
    return a.label.localeCompare(b.label);
  });

  return ranked.slice(0, STATS_TOP_ARTISTS);
}

export async function groupTwelveInchYearsForOwner(
  ownerId: string
): Promise<Array<{ label: string; count: number }>> {
  const rows = await prisma.collectionTwelveInchSingle.groupBy({
    by: ['year'],
    where: { ownerId, year: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { year: 'desc' } },
    take: STATS_TOP_YEARS,
  });

  const ranked = rows.map((r) => ({
    label: r.year === null || r.year === undefined ? 'Unknown' : String(r.year),
    count: countFromGroup(r),
  }));

  ranked.sort((a, b) => {
    const d = b.count - a.count;
    if (d !== 0) return d;
    return a.label.localeCompare(b.label);
  });

  return ranked.slice(0, STATS_TOP_YEARS);
}
