import { prisma } from '@/db/client';

export async function isFollowing(
  followerId: string,
  followedId: string
): Promise<boolean> {
  const row = await prisma.userFollow.findFirst({
    where: { followerId, followedId },
    select: { id: true },
  });
  return Boolean(row);
}

export async function getFollowCounts(userId: string): Promise<{
  followers: number;
  following: number;
}> {
  const [followers, following] = await Promise.all([
    prisma.userFollow.count({ where: { followedId: userId } }),
    prisma.userFollow.count({ where: { followerId: userId } }),
  ]);
  return { followers, following };
}
