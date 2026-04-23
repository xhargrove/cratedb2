import { prisma } from '@/db/client';

import type { TwelveInchWriteInput } from '@/server/twelve-inch-singles/types';

export async function createTwelveInchForOwner(
  ownerId: string,
  data: TwelveInchWriteInput
) {
  return prisma.collectionTwelveInchSingle.create({
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
