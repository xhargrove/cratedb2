import { prisma } from '@/db/client';

import type { SingleWriteInput } from '@/server/singles/types';

export async function updateSingleForOwner(
  id: string,
  ownerId: string,
  data: SingleWriteInput
) {
  const result = await prisma.collectionSingle.updateMany({
    where: { id, ownerId },
    data: {
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
  return result.count === 1;
}
