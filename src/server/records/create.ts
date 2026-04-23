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
      storageKind: data.storageKind,
      shelfRow: data.shelfRow ?? null,
      shelfColumn: data.shelfColumn ?? null,
      crateNumber: data.crateNumber ?? null,
      boxNumber: data.boxNumber ?? null,
      boxCustomLabel: data.boxCustomLabel?.trim()
        ? data.boxCustomLabel.trim()
        : null,
      storageLocation: data.storageLocation ?? null,
      notes: data.notes ?? null,
      spotifyAlbumId: data.spotifyAlbumId ?? null,
      quantity: data.quantity,
      containerId: data.containerId ?? null,
    },
  });
}
