'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/db/client';
import { parseArtworkFileUpload } from '@/lib/validations/artwork';
import { parseProfileUpdateForm } from '@/lib/validations/profile';
import { logger } from '@/lib/logger';
import { requireUser } from '@/server/auth/require-user';
import {
  profileImageRelativeKey,
} from '@/server/storage/artwork-keys';
import {
  deleteArtworkObject,
  writeArtworkObject,
} from '@/server/storage/artwork-store';
import {
  updateProfileForUser,
  type ProfileImageOp,
} from '@/server/profile/update-profile';

export type ProfileActionState = { error?: string; ok?: boolean } | null;

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const user = await requireUser();

  const parsed = parseProfileUpdateForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const { removeProfileImage, ...profileFields } = parsed.data;

  const current = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { profileImageKey: true },
  });

  let imageOp: ProfileImageOp = { kind: 'keep' };

  try {
    if (removeProfileImage) {
      if (current?.profileImageKey) {
        await deleteArtworkObject(current.profileImageKey);
      }
      imageOp = { kind: 'clear' };
    } else {
      const uploaded = await parseArtworkFileUpload(
        formData.get('profileImage'),
        undefined
      );
      if (!uploaded.ok) {
        return { error: uploaded.error };
      }
      if (uploaded.kind === 'present') {
        const key = profileImageRelativeKey(user.id, uploaded.mimeType);
        if (current?.profileImageKey && current.profileImageKey !== key) {
          await deleteArtworkObject(current.profileImageKey);
        }
        await writeArtworkObject(key, uploaded.buffer, uploaded.mimeType);
        imageOp = {
          kind: 'replace',
          key,
          mimeType: uploaded.mimeType,
        };
      }
    }

    await updateProfileForUser(user.id, profileFields, imageOp);
  } catch (e) {
    logger.error({ err: e, userId: user.id }, 'updateProfile failed');
    return { error: 'Could not save profile.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/profile');
  revalidatePath(`/u/${user.id}`);

  return { ok: true };
}
