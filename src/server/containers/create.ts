import { prisma } from '@/db/client';

import type { ContainerWriteInput } from '@/server/containers/types';

export async function createStorageContainerForOwner(
  ownerId: string,
  data: ContainerWriteInput
) {
  return prisma.storageContainer.create({
    data: {
      ownerId,
      name: data.name.trim(),
      kind: data.kind,
      locationNote: data.locationNote?.trim()
        ? data.locationNote.trim()
        : null,
    },
  });
}
