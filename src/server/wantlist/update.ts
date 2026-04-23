import { prisma } from '@/db/client';
import { buildWantlistDedupeKey } from '@/lib/wantlist-dedupe';

import type { WantlistWriteInput } from '@/server/wantlist/types';

export async function updateWantlistItemForOwner(
  id: string,
  ownerId: string,
  data: WantlistWriteInput
) {
  const dedupeKey = buildWantlistDedupeKey(data.artist, data.title, data.year);

  const result = await prisma.wantlistItem.updateMany({
    where: { id, ownerId },
    data: {
      artist: data.artist,
      title: data.title,
      year: data.year ?? null,
      genre: data.genre ?? null,
      notes: data.notes ?? null,
      dedupeKey,
    },
  });
  return result.count === 1;
}
