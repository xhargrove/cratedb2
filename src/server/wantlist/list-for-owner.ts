import { prisma } from '@/db/client';

export async function listWantlistItemsForOwner(ownerId: string) {
  return prisma.wantlistItem.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
  });
}
