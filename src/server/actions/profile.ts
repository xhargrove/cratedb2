'use server';

import { revalidatePath } from 'next/cache';

import { parseProfileUpdateForm } from '@/lib/validations/profile';
import { logger } from '@/lib/logger';
import { requireUser } from '@/server/auth/require-user';
import { updateProfileForUser } from '@/server/profile/update-profile';

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

  try {
    await updateProfileForUser(user.id, parsed.data);
  } catch (e) {
    logger.error({ err: e, userId: user.id }, 'updateProfile failed');
    return { error: 'Could not save profile.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/profile');
  revalidatePath(`/u/${user.id}`);

  return { ok: true };
}
