import { prisma } from '@/db/client';

import type { RecordWriteInput } from '@/server/records/types';

/**
 * Updates only when both `id` and `ownerId` match (single-row ownership).
 * Returns whether a row was updated.
 */
export async function updateRecordForOwner(
  id: string,
  ownerId: string,
  data: RecordWriteInput
) {
  const result = await prisma.collectionRecord.updateMany({
    where: { id, ownerId },
    data: {
      artist: data.artist,
      title: data.title,
      year: data.year ?? null,
      genre: data.genre ?? null,
      storageLocation: data.storageLocation ?? null,
      notes: data.notes ?? null,
    },
  });
  return result.count === 1;
}
