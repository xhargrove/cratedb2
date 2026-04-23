import { prisma } from '@/db/client';

export async function removeFollowForUsers(
  followerId: string,
  followedId: string
) {
  const result = await prisma.userFollow.deleteMany({
    where: { followerId, followedId },
  });
  return result.count === 1;
}
