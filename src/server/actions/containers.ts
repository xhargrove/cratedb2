'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/db/client';
import { logger } from '@/lib/logger';
import { parseArtworkFileUpload } from '@/lib/validations/artwork';
import {
  parseContainerForm,
  parseContainerId,
} from '@/lib/validations/container';
import { parseRecordId } from '@/lib/validations/record';
import { requireUser } from '@/server/auth/require-user';
import { storageContainerExistsForOwner } from '@/server/containers/assert-owned';
import { createStorageContainerForOwner } from '@/server/containers/create';
import { deleteStorageContainerForOwner } from '@/server/containers/delete';
import { updateStorageContainerForOwner } from '@/server/containers/update';
import { getRecordByIdForOwner } from '@/server/records/get-by-id-for-owner';
import { containerImageRelativeKey } from '@/server/storage/artwork-keys';
import {
  deleteArtworkObject,
  writeArtworkObject,
} from '@/server/storage/artwork-store';

export type ContainerActionState = { error?: string; ok?: boolean } | null;

function revalidateContainerPaths(containerId?: string) {
  revalidatePath('/dashboard/containers');
  if (containerId) {
    revalidatePath(`/dashboard/containers/${containerId}`);
    revalidatePath(`/dashboard/containers/${containerId}/edit`);
  }
  revalidatePath('/dashboard/records');
}

export async function createStorageContainerAction(
  _prev: ContainerActionState,
  formData: FormData
): Promise<ContainerActionState> {
  const user = await requireUser();
  const parsed = parseContainerForm(formData);
  const imageParsed = await parseArtworkFileUpload(formData.get('image'));

  if (!parsed.ok) return { error: parsed.error };
  if (!imageParsed.ok) return { error: imageParsed.error };

  let row;
  try {
    row = await createStorageContainerForOwner(user.id, parsed.data);
  } catch (e) {
    logger.error({ err: e, ownerId: user.id }, 'createStorageContainer failed');
    return { error: 'Could not save container.' };
  }

  if (imageParsed.kind === 'present') {
    const key = containerImageRelativeKey(
      user.id,
      row.id,
      imageParsed.mimeType
    );
    try {
      await writeArtworkObject(key, imageParsed.buffer, imageParsed.mimeType);
      await prisma.storageContainer.update({
        where: { id: row.id },
        data: {
          imageKey: key,
          imageMimeType: imageParsed.mimeType,
          imageUpdatedAt: new Date(),
        },
      });
    } catch (e) {
      logger.error({ err: e, containerId: row.id }, 'container image upload failed');
      await deleteArtworkObject(key).catch(() => {});
      await prisma.storageContainer.delete({ where: { id: row.id } }).catch(() => {});
      return {
        error:
          'Could not save image. Container was not created. Try a smaller file.',
      };
    }
  }

  revalidateContainerPaths(row.id);
  redirect(`/dashboard/containers/${row.id}`);
}

export async function updateStorageContainerAction(
  _prev: ContainerActionState,
  formData: FormData
): Promise<ContainerActionState> {
  const user = await requireUser();
  const idParsed = parseContainerId(formData.get('containerId'));
  if (!idParsed.ok) return { error: idParsed.error };

  const existing = await prisma.storageContainer.findFirst({
    where: { id: idParsed.id, ownerId: user.id },
    select: { imageKey: true },
  });
  if (!existing) {
    return { error: 'Container not found or you do not have permission.' };
  }

  const parsed = parseContainerForm(formData);
  const imageParsed = await parseArtworkFileUpload(formData.get('image'));
  const removeImage = formData.get('removeImage') === '1';

  if (!parsed.ok) return { error: parsed.error };
  if (!imageParsed.ok) return { error: imageParsed.error };

  let updated: boolean;
  try {
    updated = await updateStorageContainerForOwner(
      idParsed.id,
      user.id,
      parsed.data
    );
  } catch (e) {
    logger.error({ err: e, containerId: idParsed.id }, 'updateStorageContainer failed');
    return { error: 'Could not update container.' };
  }
  if (!updated) {
    return { error: 'Container not found or you do not have permission.' };
  }

  try {
    if (removeImage) {
      const prevKey = existing.imageKey;
      await prisma.storageContainer.updateMany({
        where: { id: idParsed.id, ownerId: user.id },
        data: {
          imageKey: null,
          imageMimeType: null,
          imageUpdatedAt: null,
        },
      });
      if (prevKey) await deleteArtworkObject(prevKey);
    } else if (imageParsed.kind === 'present') {
      const newKey = containerImageRelativeKey(
        user.id,
        idParsed.id,
        imageParsed.mimeType
      );
      await writeArtworkObject(
        newKey,
        imageParsed.buffer,
        imageParsed.mimeType
      );
      await prisma.storageContainer.updateMany({
        where: { id: idParsed.id, ownerId: user.id },
        data: {
          imageKey: newKey,
          imageMimeType: imageParsed.mimeType,
          imageUpdatedAt: new Date(),
        },
      });
      if (existing.imageKey && existing.imageKey !== newKey) {
        await deleteArtworkObject(existing.imageKey);
      }
    }
  } catch (e) {
    logger.error({ err: e, containerId: idParsed.id }, 'container image update failed');
    return { error: 'Could not update container image.' };
  }

  revalidateContainerPaths(idParsed.id);
  redirect(`/dashboard/containers/${idParsed.id}`);
}

export async function deleteStorageContainerAction(
  _prev: ContainerActionState,
  formData: FormData
): Promise<ContainerActionState> {
  const user = await requireUser();
  const idParsed = parseContainerId(formData.get('containerId'));
  if (!idParsed.ok) return { error: idParsed.error };

  const ok = await deleteStorageContainerForOwner(idParsed.id, user.id);
  if (!ok) {
    return { error: 'Container not found or you do not have permission.' };
  }

  revalidateContainerPaths();
  revalidatePath(`/dashboard/containers/${idParsed.id}`);
  redirect('/dashboard/containers');
}

export async function assignRecordToContainerAction(
  _prev: ContainerActionState,
  formData: FormData
): Promise<ContainerActionState> {
  const user = await requireUser();
  const cParsed = parseContainerId(formData.get('containerId'));
  const rParsed = parseRecordId(formData.get('recordId'));
  if (!cParsed.ok) return { error: cParsed.error };
  if (!rParsed.ok) return { error: rParsed.error };

  const owned = await storageContainerExistsForOwner(cParsed.id, user.id);
  if (!owned) {
    return { error: 'Container not found or you do not have permission.' };
  }
  const record = await getRecordByIdForOwner(rParsed.id, user.id);
  if (!record) {
    return { error: 'Record not found or you do not have permission.' };
  }

  try {
    await prisma.collectionRecord.updateMany({
      where: { id: rParsed.id, ownerId: user.id },
      data: { containerId: cParsed.id },
    });
  } catch (e) {
    logger.error({ err: e }, 'assignRecordToContainer failed');
    return { error: 'Could not assign record.' };
  }

  revalidateContainerPaths(cParsed.id);
  revalidatePath(`/dashboard/records/${rParsed.id}`);
  revalidatePath(`/dashboard/records/${rParsed.id}/edit`);
  return null;
}

export async function removeRecordFromContainerAction(
  _prev: ContainerActionState,
  formData: FormData
): Promise<ContainerActionState> {
  const user = await requireUser();
  const cParsed = parseContainerId(formData.get('containerId'));
  const rParsed = parseRecordId(formData.get('recordId'));
  if (!cParsed.ok) return { error: cParsed.error };
  if (!rParsed.ok) return { error: rParsed.error };

  const res = await prisma.collectionRecord.updateMany({
    where: {
      id: rParsed.id,
      ownerId: user.id,
      containerId: cParsed.id,
    },
    data: { containerId: null },
  });
  if (res.count !== 1) {
    return { error: 'Record is not in this container or access denied.' };
  }

  revalidateContainerPaths(cParsed.id);
  revalidatePath(`/dashboard/records/${rParsed.id}`);
  revalidatePath(`/dashboard/records/${rParsed.id}/edit`);
  return null;
}
