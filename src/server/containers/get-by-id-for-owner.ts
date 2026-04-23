import { COLLECTION_LIST_MAX } from '@/lib/collection-constants';
import { prisma } from '@/db/client';

export async function getStorageContainerByIdForOwner(
  id: string,
  ownerId: string
) {
  return prisma.storageContainer.findFirst({
    where: { id, ownerId },
    include: {
      _count: { select: { records: true } },
      records: {
        orderBy: [{ artist: 'asc' }, { title: 'asc' }],
        take: COLLECTION_LIST_MAX,
        select: {
          id: true,
          artist: true,
          title: true,
          year: true,
          quantity: true,
          artworkKey: true,
          artworkUpdatedAt: true,
        },
      },
    },
  });
}
