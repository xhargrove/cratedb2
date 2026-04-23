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
      storageLocation: data.storageLocation ?? null,
      notes: data.notes ?? null,
      spotifyTrackId: data.spotifyTrackId?.trim()
        ? data.spotifyTrackId.trim()
        : null,
    },
  });
}
