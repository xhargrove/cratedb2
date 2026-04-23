import type { ProfileVibe } from '@/generated/prisma/client';

import { prisma } from '@/db/client';

export async function updateProfileForUser(
  userId: string,
  data: {
    displayName: string | null;
    bio: string | null;
    vibe: ProfileVibe;
    collectionPublic: boolean;
  }
) {
  await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      displayName: data.displayName,
      bio: data.bio,
      vibe: data.vibe,
      collectionPublic: data.collectionPublic,
    },
    update: {
      displayName: data.displayName,
      bio: data.bio,
      vibe: data.vibe,
      collectionPublic: data.collectionPublic,
    },
  });
}
