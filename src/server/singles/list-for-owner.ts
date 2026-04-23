import { COLLECTION_LIST_MAX } from '@/lib/collection-constants';
import { prisma } from '@/db/client';
import type { Prisma } from '@/generated/prisma/client';

export type ListSinglesOptions = {
  /** Case-insensitive search across key text columns. */
  search?: string;
};

function whereForOwner(
  ownerId: string,
  options?: ListSinglesOptions
): Prisma.CollectionSingleWhereInput {
  const q = options?.search?.trim();
  if (!q) return { ownerId };

  return {
    AND: [
      { ownerId },
      {
        OR: [
          { artist: { contains: q, mode: 'insensitive' } },
          { title: { contains: q, mode: 'insensitive' } },
          { bSideTitle: { contains: q, mode: 'insensitive' } },
          { genre: { contains: q, mode: 'insensitive' } },
          { storageLocation: { contains: q, mode: 'insensitive' } },
          { notes: { contains: q, mode: 'insensitive' } },
        ],
      },
    ],
  };
}

export async function listSinglesForOwner(
  ownerId: string,
  options?: ListSinglesOptions
) {
  const where = whereForOwner(ownerId, options);
  const total = await prisma.collectionSingle.count({ where });

  const rows = await prisma.collectionSingle.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: COLLECTION_LIST_MAX,
    select: {
      id: true,
      artist: true,
      title: true,
      bSideTitle: true,
      year: true,
      genre: true,
      storageLocation: true,
      artworkKey: true,
      artworkUpdatedAt: true,
      quantity: true,
      createdAt: true,
    },
  });

  return {
    singles: rows,
    total,
    capped: total > COLLECTION_LIST_MAX,
  };
}
