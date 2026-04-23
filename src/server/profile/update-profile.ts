import type { ProfileVibe } from '@/generated/prisma/client';

import { prisma } from '@/db/client';

export type ProfileImageOp =
  | { kind: 'keep' }
  | { kind: 'clear' }
  | { kind: 'replace'; key: string; mimeType: string };

export async function updateProfileForUser(
  userId: string,
  data: {
    displayName: string | null;
    bio: string | null;
    vibe: ProfileVibe;
    collectionPublic: boolean;
  },
  imageOp: ProfileImageOp
) {
  const now = new Date();

  if (imageOp.kind === 'replace') {
    await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        displayName: data.displayName,
        bio: data.bio,
        vibe: data.vibe,
        collectionPublic: data.collectionPublic,
        profileImageKey: imageOp.key,
        profileImageMimeType: imageOp.mimeType,
        profileImageUpdatedAt: now,
      },
      update: {
        displayName: data.displayName,
        bio: data.bio,
        vibe: data.vibe,
        collectionPublic: data.collectionPublic,
        profileImageKey: imageOp.key,
        profileImageMimeType: imageOp.mimeType,
        profileImageUpdatedAt: now,
      },
    });
    return;
  }

  if (imageOp.kind === 'clear') {
    await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        displayName: data.displayName,
        bio: data.bio,
        vibe: data.vibe,
        collectionPublic: data.collectionPublic,
        profileImageKey: null,
        profileImageMimeType: null,
        profileImageUpdatedAt: null,
      },
      update: {
        displayName: data.displayName,
        bio: data.bio,
        vibe: data.vibe,
        collectionPublic: data.collectionPublic,
        profileImageKey: null,
        profileImageMimeType: null,
        profileImageUpdatedAt: null,
      },
    });
    return;
  }

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
