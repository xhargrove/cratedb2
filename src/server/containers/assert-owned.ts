import { prisma } from '@/db/client';

export async function storageContainerExistsForOwner(
  containerId: string,
  ownerId: string
) {
  const row = await prisma.storageContainer.findFirst({
    where: { id: containerId, ownerId },
    select: { id: true },
  });
  return Boolean(row);
}
