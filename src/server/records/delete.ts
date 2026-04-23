import { prisma } from '@/db/client';
import { logger } from '@/lib/logger';
import { deleteArtworkBundle } from '@/server/storage/artwork-bundle';

/**
 * Deletes only when both `id` and `ownerId` match.
 * Removes stored artwork file when present (orphan cleanup).
 * Returns whether a row was removed.
 */
export async function deleteRecordForOwner(id: string, ownerId: string) {
  const row = await prisma.collectionRecord.findFirst({
    where: { id, ownerId },
    select: { artworkKey: true },
  });

  const result = await prisma.collectionRecord.deleteMany({
    where: { id, ownerId },
  });

  if (result.count === 1 && row?.artworkKey) {
    try {
      await deleteArtworkBundle(row.artworkKey);
    } catch (e) {
      logger.warn(
        { err: e, recordId: id, artworkKey: row.artworkKey },
        'deleteRecord: artwork file cleanup failed'
      );
    }
  }

  return result.count === 1;
}
