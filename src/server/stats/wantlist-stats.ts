import { prisma } from '@/db/client';

export async function countWantlistItemsForOwner(
  ownerId: string
): Promise<number> {
  return prisma.wantlistItem.count({ where: { ownerId } });
}
