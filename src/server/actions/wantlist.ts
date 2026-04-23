'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/db/client';
import { logger } from '@/lib/logger';
import { buildWantlistDedupeKey } from '@/lib/wantlist-dedupe';
import { parseWantlistForm, parseWantlistId } from '@/lib/validations/wantlist';
import { requireUser } from '@/server/auth/require-user';
import { createWantlistItemForOwner } from '@/server/wantlist/create';
import { deleteWantlistItemForOwner } from '@/server/wantlist/delete';
import { getWantlistItemByIdForOwner } from '@/server/wantlist/get-by-id-for-owner';
import { updateWantlistItemForOwner } from '@/server/wantlist/update';
import { userAlreadyOwnsEquivalentRelease } from '@/server/wantlist/already-owned';

export type WantlistActionState = { error?: string } | null;

export async function createWantlistItemAction(
  _prevState: WantlistActionState,
  formData: FormData
): Promise<WantlistActionState> {
  const user = await requireUser();

  const parsed = parseWantlistForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const dedupeKey = buildWantlistDedupeKey(
    parsed.data.artist,
    parsed.data.title,
    parsed.data.year
  );

  const dup = await prisma.wantlistItem.findFirst({
    where: { ownerId: user.id, dedupeKey },
    select: { id: true },
  });
  if (dup) {
    return {
      error:
        'That artist, title, and year combination is already on your wantlist.',
    };
  }

  const owned = await userAlreadyOwnsEquivalentRelease(
    user.id,
    parsed.data.artist,
    parsed.data.title,
    parsed.data.year
  );
  if (owned) {
    return {
      error:
        'You already own this release in your collection — remove it from records before adding it here, or adjust artist/title/year.',
    };
  }

  try {
    await createWantlistItemForOwner(user.id, parsed.data);
  } catch (e) {
    logger.error({ err: e, ownerId: user.id }, 'createWantlistItem failed');
    return { error: 'Could not save wantlist item.' };
  }

  revalidatePath('/dashboard/wantlist');
  redirect('/dashboard/wantlist');
}

export async function updateWantlistItemAction(
  _prevState: WantlistActionState,
  formData: FormData
): Promise<WantlistActionState> {
  const user = await requireUser();

  const idParsed = parseWantlistId(formData.get('wantlistId'));
  if (!idParsed.ok) {
    return { error: idParsed.error };
  }

  const existing = await getWantlistItemByIdForOwner(idParsed.id, user.id);
  if (!existing) {
    return {
      error:
        'Wantlist item not found or you do not have permission to edit it.',
    };
  }

  const parsed = parseWantlistForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const dedupeKey = buildWantlistDedupeKey(
    parsed.data.artist,
    parsed.data.title,
    parsed.data.year
  );

  const dup = await prisma.wantlistItem.findFirst({
    where: {
      ownerId: user.id,
      dedupeKey,
      NOT: { id: idParsed.id },
    },
    select: { id: true },
  });
  if (dup) {
    return {
      error:
        'Another entry already uses this artist, title, and year combination.',
    };
  }

  const owned = await userAlreadyOwnsEquivalentRelease(
    user.id,
    parsed.data.artist,
    parsed.data.title,
    parsed.data.year
  );
  if (owned) {
    return {
      error:
        'You already own this release in your collection — adjust fields or remove the owned record first.',
    };
  }

  let updated: boolean;
  try {
    updated = await updateWantlistItemForOwner(
      idParsed.id,
      user.id,
      parsed.data
    );
  } catch (e) {
    logger.error(
      { err: e, wantlistId: idParsed.id },
      'updateWantlistItem failed'
    );
    return { error: 'Could not update wantlist item.' };
  }

  if (!updated) {
    return {
      error:
        'Wantlist item not found or you do not have permission to edit it.',
    };
  }

  revalidatePath('/dashboard/wantlist');
  redirect(`/dashboard/wantlist`);
}

export async function deleteWantlistItemAction(
  formData: FormData
): Promise<void> {
  const user = await requireUser();

  const idParsed = parseWantlistId(formData.get('id'));
  if (!idParsed.ok) {
    redirect('/dashboard/wantlist?wantlistError=invalid-id');
  }

  try {
    const deleted = await deleteWantlistItemForOwner(idParsed.id, user.id);
    if (!deleted) {
      redirect('/dashboard/wantlist?wantlistError=not-found');
    }
  } catch (e) {
    logger.error({ err: e, id: idParsed.id }, 'deleteWantlistItem failed');
    redirect('/dashboard/wantlist?wantlistError=failed');
  }

  revalidatePath('/dashboard/wantlist');
  redirect('/dashboard/wantlist');
}
