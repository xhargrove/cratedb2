import { COLLECTION_LIST_MAX } from '@/lib/collection-constants';
import { prisma } from '@/db/client';

/**
 * Album rows the owner can move into `containerId` (excludes records already in this container).
 */
export async function listRecordsAssignableToContainer(
  ownerId: string,
  containerId: string
) {
  return prisma.collectionRecord.findMany({
    where: {
      ownerId,
      OR: [{ containerId: null }, { containerId: { not: containerId } }],
    },
    orderBy: [{ artist: 'asc' }, { title: 'asc' }],
    take: COLLECTION_LIST_MAX,
    select: {
      id: true,
      artist: true,
      title: true,
      year: true,
      containerId: true,
    },
  });
}
