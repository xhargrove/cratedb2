import { prisma } from '@/db/client';

import type { SingleWriteInput } from '@/server/singles/types';

export async function createSingleForOwner(
  ownerId: string,
  data: SingleWriteInput
) {
  return prisma.collectionSingle.create({
    data: {
      ownerId,
      artist: data.artist,
      title: data.title,
      bSideTitle: data.bSideTitle?.trim() ? data.bSideTitle.trim() : null,
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
      spotifyTrackId: data.spotifyTrackId?.trim()
        ? data.spotifyTrackId.trim()
        : null,
      quantity: data.quantity,
    },
  });
}
