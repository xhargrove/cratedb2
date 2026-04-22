import { prisma } from '@/db/client';

/**
 * Single record visible only when `id` belongs to `ownerId`.
 * Used for read/update/delete authorization — never trust client owner hints.
 */
export async function getRecordByIdForOwner(id: string, ownerId: string) {
  return prisma.collectionRecord.findFirst({
    where: {
      id,
      ownerId,
    },
  });
}
