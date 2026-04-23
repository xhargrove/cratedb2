import { prisma } from '@/db/client';

export async function deleteWantlistItemForOwner(id: string, ownerId: string) {
  const result = await prisma.wantlistItem.deleteMany({
    where: { id, ownerId },
  });
  return result.count === 1;
}
