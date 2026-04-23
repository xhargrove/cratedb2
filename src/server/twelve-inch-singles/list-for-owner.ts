import { COLLECTION_LIST_MAX } from '@/lib/collection-constants';
import { prisma } from '@/db/client';

export async function listTwelveInchForOwner(ownerId: string) {
  const total = await prisma.collectionTwelveInchSingle.count({
    where: { ownerId },
  });

  const rows = await prisma.collectionTwelveInchSingle.findMany({
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
      quantity: true,
      createdAt: true,
    },
  });

  return {
    twelveInches: rows,
    total,
    capped: total > COLLECTION_LIST_MAX,
  };
}
