import { prisma } from '@/db/client';

/**
 * Whether another user may view this owner's collection on `/u/[id]`.
 * Missing profile defaults to public (same as schema default).
 */
export async function isOwnerCollectionPublic(
  ownerUserId: string
): Promise<boolean> {
  const profile = await prisma.profile.findUnique({
    where: { userId: ownerUserId },
    select: { collectionPublic: true },
  });
  return profile?.collectionPublic ?? true;
}
