import { prisma } from '@/db/client';

export async function getWantlistItemByIdForOwner(id: string, ownerId: string) {
  return prisma.wantlistItem.findFirst({
    where: { id, ownerId },
  });
}
