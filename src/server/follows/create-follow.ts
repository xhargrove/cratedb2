import { prisma } from '@/db/client';

/**
 * Create follow edge. Caller must enforce target exists, not self, not duplicate.
 */
export async function createFollowForUsers(
  followerId: string,
  followedId: string
) {
  return prisma.userFollow.create({
    data: { followerId, followedId },
  });
}
