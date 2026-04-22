import type { Prisma } from '@/generated/prisma/client';

import { prisma } from '@/db/client';

import type { SortKey } from '@/lib/collection-query-params';

export type ListRecordsOptions = {
  /** Case-insensitive substring across artist, title, genre, storageLocation, notes */
  search?: string;
  sort?: SortKey;
  /** Exact match on stored genre string */
  genre?: string;
  /** Exact match on stored storageLocation string */
  storageLocation?: string;
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
    parts.push({ genre });
  }

  if (storageLocation) {
    parts.push({ storageLocation });
  }

  if (parts.length === 1) return parts[0] as Prisma.CollectionRecordWhereInput;

  return { AND: parts };
}

/**
 * Lists collection rows for one owner with optional search, filters, and sort.
 * Single canonical query — grid/list UI only changes presentation.
 */
export async function listRecordsForOwner(
  ownerId: string,
  options?: ListRecordsOptions
) {
  const where = buildWhere(ownerId, options);

  return prisma.collectionRecord.findMany({
    where,
    orderBy: orderForSort(options?.sort),
  });
}

/** @internal exported for tests */
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

export async function countRecordsForOwner(ownerId: string) {
  return prisma.collectionRecord.count({
    where: { ownerId },
  });
}

/** Distinct genre and storageLocation values for filter dropdowns (owner-scoped). */
export async function getCollectionFacets(ownerId: string) {
  const rows = await prisma.collectionRecord.findMany({
    where: { ownerId },
    select: { genre: true, storageLocation: true },
  });

  const genres = [
    ...new Set(
      rows.map((r) => r.genre?.trim()).filter((g): g is string => Boolean(g))
    ),
  ].sort((a, b) => a.localeCompare(b));

  const locations = [
    ...new Set(
      rows
        .map((r) => r.storageLocation?.trim())
        .filter((s): s is string => Boolean(s))
    ),
  ].sort((a, b) => a.localeCompare(b));

  return { genres, locations };
}
