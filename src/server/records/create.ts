import { prisma } from '@/db/client';

import type { RecordWriteInput } from '@/server/records/types';

export async function createRecordForOwner(
  ownerId: string,
  data: RecordWriteInput
) {
  return prisma.collectionRecord.create({
    data: {
      ownerId,
      artist: data.artist,
      title: data.title,
      year: data.year ?? null,
      genre: data.genre ?? null,
      storageLocation: data.storageLocation ?? null,
      notes: data.notes ?? null,
    },
  });
}
