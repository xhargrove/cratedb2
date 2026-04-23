import { prisma } from '@/db/client';

/** Minimal rows for record form dropdowns. */
export async function listContainerSelectOptionsForOwner(ownerId: string) {
  return prisma.storageContainer.findMany({
    where: { ownerId },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
}

export async function listStorageContainersForOwner(ownerId: string) {
  return prisma.storageContainer.findMany({
    where: { ownerId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      kind: true,
      locationNote: true,
      imageKey: true,
      imageMimeType: true,
      imageUpdatedAt: true,
      updatedAt: true,
      _count: { select: { records: true } },
    },
  });
}
