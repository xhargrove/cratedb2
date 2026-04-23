import { prisma } from '@/db/client';
import { logger } from '@/lib/logger';
import { deleteArtworkObject } from '@/server/storage/artwork-store';

export async function deleteTwelveInchForOwner(id: string, ownerId: string) {
  const row = await prisma.collectionTwelveInchSingle.findFirst({
    where: { id, ownerId },
    select: { artworkKey: true },
  });

  const result = await prisma.collectionTwelveInchSingle.deleteMany({
    where: { id, ownerId },
  });

  if (result.count === 1 && row?.artworkKey) {
    try {
      await deleteArtworkObject(row.artworkKey);
    } catch (e) {
      logger.warn(
        { err: e, twelveInchId: id, artworkKey: row.artworkKey },
        'deleteTwelveInch: artwork file cleanup failed'
      );
    }
  }

  return result.count === 1;
}
