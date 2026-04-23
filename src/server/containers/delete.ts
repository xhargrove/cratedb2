import { prisma } from '@/db/client';
import { logger } from '@/lib/logger';
import { deleteArtworkObject } from '@/server/storage/artwork-store';

export async function deleteStorageContainerForOwner(id: string, ownerId: string) {
  const existing = await prisma.storageContainer.findFirst({
    where: { id, ownerId },
    select: { imageKey: true },
  });
  if (!existing) return false;

  await prisma.storageContainer.deleteMany({
    where: { id, ownerId },
  });

  if (existing.imageKey) {
    try {
      await deleteArtworkObject(existing.imageKey);
    } catch (e) {
      logger.warn(
        { err: e, containerId: id, key: existing.imageKey },
        'container image delete failed after container removed'
      );
    }
  }

  return true;
}
