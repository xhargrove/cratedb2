'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { logger } from '@/lib/logger';
import { parseRecordForm, parseRecordId } from '@/lib/validations/record';
import { requireUser } from '@/server/auth/require-user';
import { createRecordForOwner } from '@/server/records/create';
import { deleteRecordForOwner } from '@/server/records/delete';
import { updateRecordForOwner } from '@/server/records/update';

export type RecordActionState = { error?: string; ok?: boolean } | null;

function revalidateRecordPaths(recordId?: string) {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/records');
  if (recordId) {
    revalidatePath(`/dashboard/records/${recordId}`);
    revalidatePath(`/dashboard/records/${recordId}/edit`);
  }
}

export async function createRecordAction(
  _prevState: RecordActionState,
  formData: FormData
): Promise<RecordActionState> {
  const user = await requireUser();

  const parsed = parseRecordForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  let record;
  try {
    record = await createRecordForOwner(user.id, parsed.data);
  } catch (e) {
    logger.error({ err: e, ownerId: user.id }, 'createRecord failed');
    return { error: 'Could not save record.' };
  }

  revalidateRecordPaths(record.id);
  redirect(`/dashboard/records/${record.id}`);
}

export async function updateRecordAction(
  _prevState: RecordActionState,
  formData: FormData
): Promise<RecordActionState> {
  const user = await requireUser();

  const idParsed = parseRecordId(formData.get('recordId'));
  if (!idParsed.ok) {
    return { error: idParsed.error };
  }

  const parsed = parseRecordForm(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  let updated: boolean;
  try {
    updated = await updateRecordForOwner(idParsed.id, user.id, parsed.data);
  } catch (e) {
    logger.error({ err: e, recordId: idParsed.id }, 'updateRecord failed');
    return { error: 'Could not update record.' };
  }

  if (!updated) {
    return {
      error: 'Record not found or you do not have permission to update it.',
    };
  }

  revalidateRecordPaths(idParsed.id);
  redirect(`/dashboard/records/${idParsed.id}`);
}

export async function deleteRecordAction(formData: FormData): Promise<void> {
  const user = await requireUser();

  const idParsed = parseRecordId(formData.get('id'));
  if (!idParsed.ok) {
    redirect('/dashboard/records');
  }

  try {
    const deleted = await deleteRecordForOwner(idParsed.id, user.id);
    if (!deleted) {
      logger.warn(
        { recordId: idParsed.id, ownerId: user.id },
        'deleteRecord: no row or not owner'
      );
    }
    revalidateRecordPaths(idParsed.id);
  } catch (e) {
    logger.error({ err: e, recordId: idParsed.id }, 'deleteRecord failed');
  }

  redirect('/dashboard/records');
}
