import { prisma } from '@/db/client';

/**
 * Deletes only when both `id` and `ownerId` match.
 * Returns whether a row was removed.
 */
export async function deleteRecordForOwner(id: string, ownerId: string) {
  const result = await prisma.collectionRecord.deleteMany({
    where: { id, ownerId },
  });
  return result.count === 1;
}
