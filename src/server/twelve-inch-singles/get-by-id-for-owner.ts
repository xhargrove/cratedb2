import { prisma } from '@/db/client';

export async function getTwelveInchByIdForOwner(id: string, ownerId: string) {
  return prisma.collectionTwelveInchSingle.findFirst({
    where: { id, ownerId },
  });
}
