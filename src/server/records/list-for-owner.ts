import type { Prisma } from '@/generated/prisma/client';

import { COLLECTION_LIST_MAX } from '@/lib/collection-constants';
import { prisma } from '@/db/client';

import type { SortKey } from '@/lib/collection-query-params';

export type ListRecordsOptions = {
  /** Case-insensitive substring across artist, title, genre, storageLocation, notes */
  search?: string;
  sort?: SortKey;
  /** Case-insensitive exact match on genre (trimmed). */
  genre?: string;
  /** Case-insensitive exact match on storageLocation (trimmed). */
  storageLocation?: string;
};

export type CollectionFacets = {
  genres: string[];
  locations: string[];
};

export type ListQueryMeta = {
  /** Rows matching current filters (same `where` as list, no `take`). */
  matchCount: number;
  /** True when more rows exist than returned (cap hit). */
  capped: boolean;
};

function orderByForSort(
  sort: SortKey | undefined
): Prisma.CollectionRecordOrderByWithRelationInput[] {
  switch (sort ?? 'newest') {
    case 'oldest':
      return [{ createdAt: 'asc' }];
    case 'artist-asc':
      return [{ artist: 'asc' }, { title: 'asc' }];
    case 'artist-desc':
      return [{ artist: 'desc' }, { title: 'asc' }];
    case 'title-asc':
      return [{ title: 'asc' }, { artist: 'asc' }];
    case 'title-desc':
      return [{ title: 'desc' }, { artist: 'asc' }];
    case 'newest':
    default:
      return [{ createdAt: 'desc' }];
  }
}

function buildWhere(
  ownerId: string,
  options: ListRecordsOptions | undefined
): Prisma.CollectionRecordWhereInput {
  const q = options?.search?.trim();
  const genre = options?.genre?.trim();
  const storageLocation = options?.storageLocation?.trim();

  const parts: Prisma.CollectionRecordWhereInput[] = [{ ownerId }];

  if (q) {
    parts.push({
      OR: [
        { artist: { contains: q, mode: 'insensitive' } },
        { title: { contains: q, mode: 'insensitive' } },
        { genre: { contains: q, mode: 'insensitive' } },
        { storageLocation: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  if (genre) {
    parts.push({
      genre: { equals: genre, mode: 'insensitive' },
    });
  }

  if (storageLocation) {
    parts.push({
      storageLocation: { equals: storageLocation, mode: 'insensitive' },
    });
  }

  if (parts.length === 1) return parts[0] as Prisma.CollectionRecordWhereInput;

  return { AND: parts };
}

/**
 * Lists collection rows for one owner with optional search, filters, and sort.
 * Single canonical query — grid/list UI only changes presentation.
 * Bounded by {@link COLLECTION_LIST_MAX}.
 */
export async function listRecordsForOwner(
  ownerId: string,
  options?: ListRecordsOptions
) {
  const where = buildWhere(ownerId, options);

  return prisma.collectionRecord.findMany({
    where,
    orderBy: orderByForSort(options?.sort),
    take: COLLECTION_LIST_MAX,
  });
}

/** Same filter scope as {@link listRecordsForOwner}, without row limit. */
export async function countMatchingRecordsForOwner(
  ownerId: string,
  options?: ListRecordsOptions
) {
  const where = buildWhere(ownerId, options);
  return prisma.collectionRecord.count({ where });
}

/** Returns list rows plus counts for truthful header copy when capped. */
export async function listRecordsWithMetaForOwner(
  ownerId: string,
  options?: ListRecordsOptions
) {
  const where = buildWhere(ownerId, options);
  const [records, matchCount] = await Promise.all([
    prisma.collectionRecord.findMany({
      where,
      orderBy: orderByForSort(options?.sort),
      take: COLLECTION_LIST_MAX,
    }),
    prisma.collectionRecord.count({ where }),
  ]);

  const capped =
    records.length >= COLLECTION_LIST_MAX && matchCount > COLLECTION_LIST_MAX;

  return {
    records,
    meta: { matchCount, capped } satisfies ListQueryMeta,
  };
}

/** @internal exported for tests — Prisma `orderBy` for a sort key. */
export function orderForSort(sort: SortKey | undefined) {
  return orderByForSort(sort);
}

/** @internal exported for tests */
export function buildWhereForOwner(
  ownerId: string,
  options?: ListRecordsOptions
) {
  return buildWhere(ownerId, options);
}

/** Dedupe facet labels case-insensitively; trims each value; preserves first-seen casing. Exported for tests. */
export function dedupeCaseInsensitiveSorted(values: string[]): string[] {
  const seen = new Map<string, string>();
  for (const v of values) {
    const t = v.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (!seen.has(key)) seen.set(key, t);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

export async function countRecordsForOwner(ownerId: string) {
  return prisma.collectionRecord.count({
    where: { ownerId },
  });
}

/** Distinct genre and storageLocation values for filter dropdowns (owner-scoped, DB-driven). */
export async function getCollectionFacets(
  ownerId: string
): Promise<CollectionFacets> {
  const [genreGroups, locationGroups] = await Promise.all([
    prisma.collectionRecord.groupBy({
      by: ['genre'],
      where: {
        ownerId,
        AND: [{ genre: { not: null } }, { NOT: { genre: { equals: '' } } }],
      },
    }),
    prisma.collectionRecord.groupBy({
      by: ['storageLocation'],
      where: {
        ownerId,
        AND: [
          { storageLocation: { not: null } },
          { NOT: { storageLocation: { equals: '' } } },
        ],
      },
    }),
  ]);

  const genreStrings = genreGroups
    .map((g) => g.genre?.trim())
    .filter((g): g is string => Boolean(g));

  const locationStrings = locationGroups
    .map((l) => l.storageLocation?.trim())
    .filter((s): s is string => Boolean(s));

  return {
    genres: dedupeCaseInsensitiveSorted(genreStrings),
    locations: dedupeCaseInsensitiveSorted(locationStrings),
  };
}
