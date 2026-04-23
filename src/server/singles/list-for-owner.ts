import { COLLECTION_LIST_MAX } from '@/lib/collection-constants';
import { prisma } from '@/db/client';

export async function listSinglesForOwner(ownerId: string) {
  const total = await prisma.collectionSingle.count({ where: { ownerId } });

  const rows = await prisma.collectionSingle.findMany({
    where: { ownerId },
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
      createdAt: true,
    },
  });

  return {
    singles: rows,
    total,
    capped: total > COLLECTION_LIST_MAX,
  };
}
