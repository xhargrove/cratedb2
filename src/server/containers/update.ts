import { prisma } from '@/db/client';

import type { ContainerWriteInput } from '@/server/containers/types';

export async function updateStorageContainerForOwner(
  id: string,
  ownerId: string,
  data: ContainerWriteInput
) {
  const result = await prisma.storageContainer.updateMany({
    where: { id, ownerId },
    data: {
      name: data.name.trim(),
      kind: data.kind,
      locationNote: data.locationNote?.trim()
        ? data.locationNote.trim()
        : null,
    },
  });
  return result.count === 1;
}
