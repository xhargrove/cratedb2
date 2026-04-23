import { prisma } from '@/db/client';
import { buildWantlistDedupeKey } from '@/lib/wantlist-dedupe';

import type { WantlistWriteInput } from '@/server/wantlist/types';

export async function createWantlistItemForOwner(
  ownerId: string,
  data: WantlistWriteInput
) {
  const dedupeKey = buildWantlistDedupeKey(data.artist, data.title, data.year);

  return prisma.wantlistItem.create({
    data: {
      ownerId,
      artist: data.artist,
      title: data.title,
      year: data.year ?? null,
      genre: data.genre ?? null,
      notes: data.notes ?? null,
      dedupeKey,
    },
  });
}
