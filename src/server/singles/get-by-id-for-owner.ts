import { prisma } from '@/db/client';

export async function getSingleByIdForOwner(id: string, ownerId: string) {
  return prisma.collectionSingle.findFirst({
    where: { id, ownerId },
  });
}
