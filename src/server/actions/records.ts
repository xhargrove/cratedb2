'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/db/client';
import { logger } from '@/lib/logger';
import {
  artworkRelativeKey,
  deleteArtworkFile,
  writeArtworkFile,
} from '@/server/storage/local-artwork-store';
import { parseArtworkFileUpload } from '@/lib/validations/artwork';
import { parseRecordForm, parseRecordId } from '@/lib/validations/record';
import { requireUser } from '@/server/auth/require-user';
import { createRecordForOwner } from '@/server/records/create';
import { deleteRecordForOwner } from '@/server/records/delete';
import { getRecordByIdForOwner } from '@/server/records/get-by-id-for-owner';
import { updateRecordForOwner } from '@/server/records/update';
import { getSpotifyIntegrationConfig } from '@/server/spotify/config';
import { fetchSpotifyAlbumCoverBuffer } from '@/server/spotify/fetch-album-cover';

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
  const artworkParsed = await parseArtworkFileUpload(formData.get('artwork'));

  if (!parsed.ok) {
    return { error: parsed.error };
  }
  if (!artworkParsed.ok) {
    return { error: artworkParsed.error };
  }

  let record;
  try {
    record = await createRecordForOwner(user.id, parsed.data);
  } catch (e) {
    logger.error({ err: e, ownerId: user.id }, 'createRecord failed');
    return { error: 'Could not save record.' };
  }

  if (artworkParsed.kind === 'present') {
    const key = artworkRelativeKey(user.id, record.id, artworkParsed.mimeType);
    try {
      await writeArtworkFile(key, artworkParsed.buffer);
      await prisma.collectionRecord.update({
        where: { id: record.id },
        data: {
          artworkKey: key,
          artworkMimeType: artworkParsed.mimeType,
          artworkUpdatedAt: new Date(),
        },
      });
    } catch (e) {
      logger.error(
        { err: e, recordId: record.id },
        'createRecord artwork failed'
      );
      await deleteArtworkFile(key).catch(() => {});
      await prisma.collectionRecord
        .delete({ where: { id: record.id } })
        .catch(() => {});
      return {
        error:
          'Could not save artwork. Record was not created. Try again with a smaller image.',
      };
    }
  } else if (parsed.data.spotifyAlbumId?.trim()) {
    const cfg = getSpotifyIntegrationConfig();
    if (cfg.enabled) {
      const cover = await fetchSpotifyAlbumCoverBuffer({
        cfg,
        albumId: parsed.data.spotifyAlbumId.trim(),
      });
      if (cover) {
        const key = artworkRelativeKey(user.id, record.id, cover.mimeType);
        try {
          await writeArtworkFile(key, cover.buffer);
          await prisma.collectionRecord.update({
            where: { id: record.id },
            data: {
              artworkKey: key,
              artworkMimeType: cover.mimeType,
              artworkUpdatedAt: new Date(),
            },
          });
        } catch (e) {
          logger.warn(
            { err: e, recordId: record.id },
            'createRecord Spotify cover failed — record saved without artwork'
          );
          await deleteArtworkFile(key).catch(() => {});
        }
      }
    }
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

  const existing = await getRecordByIdForOwner(idParsed.id, user.id);
  if (!existing) {
    return {
      error: 'Record not found or you do not have permission to update it.',
    };
  }

  const parsed = parseRecordForm(formData);
  const artworkParsed = await parseArtworkFileUpload(formData.get('artwork'));
  const removeArtwork = formData.get('removeArtwork') === '1';

  if (!parsed.ok) {
    return { error: parsed.error };
  }
  if (!artworkParsed.ok) {
    return { error: artworkParsed.error };
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

  try {
    if (removeArtwork) {
      const prevKey = existing.artworkKey;
      await prisma.collectionRecord.updateMany({
        where: { id: idParsed.id, ownerId: user.id },
        data: {
          artworkKey: null,
          artworkMimeType: null,
          artworkUpdatedAt: null,
        },
      });
      if (prevKey) {
        await deleteArtworkFile(prevKey);
      }
    } else if (artworkParsed.kind === 'present') {
      const newKey = artworkRelativeKey(
        user.id,
        idParsed.id,
        artworkParsed.mimeType
      );
      try {
        await writeArtworkFile(newKey, artworkParsed.buffer);
        await prisma.collectionRecord.updateMany({
          where: { id: idParsed.id, ownerId: user.id },
          data: {
            artworkKey: newKey,
            artworkMimeType: artworkParsed.mimeType,
            artworkUpdatedAt: new Date(),
          },
        });
        if (existing.artworkKey && existing.artworkKey !== newKey) {
          await deleteArtworkFile(existing.artworkKey);
        }
      } catch (inner) {
        await deleteArtworkFile(newKey).catch(() => {});
        throw inner;
      }
    }
  } catch (e) {
    logger.error(
      { err: e, recordId: idParsed.id },
      'updateRecord artwork failed'
    );
    return {
      error:
        'Could not update artwork. Text fields were saved; try uploading again.',
    };
  }

  try {
    if (
      artworkParsed.kind === 'absent' &&
      parsed.data.spotifyAlbumId?.trim()
    ) {
      const row = await getRecordByIdForOwner(idParsed.id, user.id);
      if (row && !row.artworkKey) {
        const cfg = getSpotifyIntegrationConfig();
        if (cfg.enabled) {
          const cover = await fetchSpotifyAlbumCoverBuffer({
            cfg,
            albumId: parsed.data.spotifyAlbumId.trim(),
          });
          if (cover) {
            const newKey = artworkRelativeKey(
              user.id,
              idParsed.id,
              cover.mimeType
            );
            await writeArtworkFile(newKey, cover.buffer);
            await prisma.collectionRecord.updateMany({
              where: { id: idParsed.id, ownerId: user.id },
              data: {
                artworkKey: newKey,
                artworkMimeType: cover.mimeType,
                artworkUpdatedAt: new Date(),
              },
            });
          }
        }
      }
    }
  } catch (e) {
    logger.warn(
      { err: e, recordId: idParsed.id },
      'updateRecord Spotify cover failed — text fields still saved'
    );
  }

  revalidateRecordPaths(idParsed.id);
  redirect(`/dashboard/records/${idParsed.id}`);
}

export async function deleteRecordAction(formData: FormData): Promise<void> {
  const user = await requireUser();

  const idParsed = parseRecordId(formData.get('id'));
  if (!idParsed.ok) {
    redirect('/dashboard/records?collectionError=delete-invalid-id');
  }

  try {
    const deleted = await deleteRecordForOwner(idParsed.id, user.id);
    if (!deleted) {
      logger.warn(
        { recordId: idParsed.id, ownerId: user.id },
        'deleteRecord: no row or not owner'
      );
      redirect('/dashboard/records?collectionError=delete-not-found');
    }
    revalidateRecordPaths(idParsed.id);
  } catch (e) {
    logger.error({ err: e, recordId: idParsed.id }, 'deleteRecord failed');
    redirect('/dashboard/records?collectionError=delete-failed');
  }

  redirect('/dashboard/records');
}
