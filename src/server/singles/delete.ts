import { prisma } from '@/db/client';
import { logger } from '@/lib/logger';
import { deleteArtworkFile } from '@/server/storage/local-artwork-store';

export async function deleteSingleForOwner(id: string, ownerId: string) {
  const row = await prisma.collectionSingle.findFirst({
    where: { id, ownerId },
    select: { artworkKey: true },
  });

  const result = await prisma.collectionSingle.deleteMany({
    where: { id, ownerId },
  });

  if (result.count === 1 && row?.artworkKey) {
    try {
      await deleteArtworkFile(row.artworkKey);
    } catch (e) {
      logger.warn(
        { err: e, singleId: id, artworkKey: row.artworkKey },
        'deleteSingle: artwork file cleanup failed'
      );
    }
  }

  return result.count === 1;
}
