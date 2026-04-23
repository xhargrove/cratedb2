import { COLLECTION_LIST_MAX } from '@/lib/collection-constants';
import { prisma } from '@/db/client';
import { isOwnerCollectionPublic } from '@/server/public/collection-access';

/** Fields safe to show on `/u/[id]` (no notes, no storage). */
export type PublicCollectionRecordRow = {
  id: string;
  artist: string;
  title: string;
  year: number | null;
  genre: string | null;
  artworkKey: string | null;
  artworkUpdatedAt: Date | null;
};

export async function listPublicCollectionForUser(
  ownerUserId: string
): Promise<
  | { visible: false; records: [] }
  | { visible: true; records: PublicCollectionRecordRow[] }
> {
  const visible = await isOwnerCollectionPublic(ownerUserId);
  if (!visible) {
    return { visible: false, records: [] };
  }

  const records = await prisma.collectionRecord.findMany({
    where: { ownerId: ownerUserId },
    orderBy: { createdAt: 'desc' },
    take: COLLECTION_LIST_MAX,
    select: {
      id: true,
      artist: true,
      title: true,
      year: true,
      genre: true,
      artworkKey: true,
      artworkUpdatedAt: true,
    },
  });

  return { visible: true, records };
}
