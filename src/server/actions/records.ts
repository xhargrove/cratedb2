'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/db/client';
import { logger } from '@/lib/logger';
import { artworkRelativeKey } from '@/server/storage/artwork-keys';
import {
  deleteArtworkBundle,
  writeArtworkBundle,
} from '@/server/storage/artwork-bundle';
import { parseArtworkFileUpload } from '@/lib/validations/artwork';
import { parseRecordForm, parseRecordId } from '@/lib/validations/record';
import { requireUser } from '@/server/auth/require-user';
import { createRecordForOwner } from '@/server/records/create';
import { deleteRecordForOwner } from '@/server/records/delete';
import { getRecordByIdForOwner } from '@/server/records/get-by-id-for-owner';
import { revalidatePhysicalSlotPagesFromRow } from '@/server/records/revalidate-physical-slot-pages';
import { updateRecordForOwner } from '@/server/records/update';
import { getSpotifyIntegrationConfig } from '@/server/spotify/config';
import { fetchSpotifyAlbumCoverBuffer } from '@/server/spotify/fetch-album-cover';

export type RecordActionState = { error?: string; ok?: boolean } | null;

function revalidateRecordPaths(recordId?: string) {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/records');
  revalidatePath('/dashboard/containers');
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
      await writeArtworkBundle(
        key,
        artworkParsed.buffer,
        artworkParsed.mimeType
      );
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
      await deleteArtworkBundle(key).catch(() => {});
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
          await writeArtworkBundle(key, cover.buffer, cover.mimeType);
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
          await deleteArtworkBundle(key).catch(() => {});
        }
      }
    }
  }

  revalidatePhysicalSlotPagesFromRow({
    storageKind: parsed.data.storageKind,
    shelfRow: parsed.data.shelfRow ?? null,
    shelfColumn: parsed.data.shelfColumn ?? null,
    crateNumber: parsed.data.crateNumber ?? null,
    boxNumber: parsed.data.boxNumber ?? null,
    boxCustomLabel: parsed.data.boxCustomLabel ?? null,
  });
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
        await deleteArtworkBundle(prevKey);
      }
    } else if (artworkParsed.kind === 'present') {
      const newKey = artworkRelativeKey(
        user.id,
        idParsed.id,
        artworkParsed.mimeType
      );
      try {
        await writeArtworkBundle(
          newKey,
          artworkParsed.buffer,
          artworkParsed.mimeType
        );
        await prisma.collectionRecord.updateMany({
          where: { id: idParsed.id, ownerId: user.id },
          data: {
            artworkKey: newKey,
            artworkMimeType: artworkParsed.mimeType,
            artworkUpdatedAt: new Date(),
          },
        });
        if (existing.artworkKey && existing.artworkKey !== newKey) {
          await deleteArtworkBundle(existing.artworkKey);
        }
      } catch (inner) {
        await deleteArtworkBundle(newKey).catch(() => {});
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
    if (artworkParsed.kind === 'absent' && parsed.data.spotifyAlbumId?.trim()) {
      const row = await getRecordByIdForOwner(idParsed.id, user.id);
      const replaceWithSpotify = formData.get('applySpotifyArtwork') === '1';
      const shouldFetchSpotifyCover =
        row && (replaceWithSpotify || !row.artworkKey);

      if (shouldFetchSpotifyCover) {
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
            const prevKey = row.artworkKey;
            try {
              await writeArtworkBundle(newKey, cover.buffer, cover.mimeType);
              await prisma.collectionRecord.updateMany({
                where: { id: idParsed.id, ownerId: user.id },
                data: {
                  artworkKey: newKey,
                  artworkMimeType: cover.mimeType,
                  artworkUpdatedAt: new Date(),
                },
              });
              if (prevKey && prevKey !== newKey) {
                await deleteArtworkBundle(prevKey);
              }
            } catch (inner) {
              await deleteArtworkBundle(newKey).catch(() => {});
              throw inner;
            }
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

  revalidatePhysicalSlotPagesFromRow({
    storageKind: existing.storageKind,
    shelfRow: existing.shelfRow,
    shelfColumn: existing.shelfColumn,
    crateNumber: existing.crateNumber,
    boxNumber: existing.boxNumber,
    boxCustomLabel: existing.boxCustomLabel,
  });
  revalidatePhysicalSlotPagesFromRow({
    storageKind: parsed.data.storageKind,
    shelfRow: parsed.data.shelfRow ?? null,
    shelfColumn: parsed.data.shelfColumn ?? null,
    crateNumber: parsed.data.crateNumber ?? null,
    boxNumber: parsed.data.boxNumber ?? null,
    boxCustomLabel: parsed.data.boxCustomLabel ?? null,
  });
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
    const pre = await prisma.collectionRecord.findFirst({
      where: { id: idParsed.id, ownerId: user.id },
      select: {
        storageKind: true,
        shelfRow: true,
        shelfColumn: true,
        crateNumber: true,
        boxNumber: true,
        boxCustomLabel: true,
      },
    });
    const deleted = await deleteRecordForOwner(idParsed.id, user.id);
    if (!deleted) {
      logger.warn(
        { recordId: idParsed.id, ownerId: user.id },
        'deleteRecord: no row or not owner'
      );
      redirect('/dashboard/records?collectionError=delete-not-found');
    }
    if (pre) {
      revalidatePhysicalSlotPagesFromRow(pre);
    }
    revalidateRecordPaths(idParsed.id);
  } catch (e) {
    logger.error({ err: e, recordId: idParsed.id }, 'deleteRecord failed');
    redirect('/dashboard/records?collectionError=delete-failed');
  }

  redirect('/dashboard/records');
}
