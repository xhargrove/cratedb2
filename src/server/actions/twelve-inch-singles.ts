'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/db/client';
import { logger } from '@/lib/logger';
import {
  parseArtworkFileUpload,
  type ParsedArtworkUpload,
} from '@/lib/validations/artwork';
import {
  parseTwelveInchForm,
  parseTwelveInchId,
} from '@/lib/validations/twelve-inch';
import { requireUser } from '@/server/auth/require-user';
import {
  twelveInchArtworkRelativeKey,
} from '@/server/storage/artwork-keys';
import {
  deleteArtworkObject,
  writeArtworkObject,
} from '@/server/storage/artwork-store';
import { getSpotifyIntegrationConfig } from '@/server/spotify/config';
import { fetchSpotifyTrackCoverBuffer } from '@/server/spotify/fetch-album-cover';
import { revalidatePhysicalSlotPagesFromRow } from '@/server/records/revalidate-physical-slot-pages';
import { createTwelveInchForOwner } from '@/server/twelve-inch-singles/create';
import { deleteTwelveInchForOwner } from '@/server/twelve-inch-singles/delete';
import { getTwelveInchByIdForOwner } from '@/server/twelve-inch-singles/get-by-id-for-owner';
import { updateTwelveInchForOwner } from '@/server/twelve-inch-singles/update';

export type TwelveInchActionState = { error?: string } | null;

function revalidateTwelveInchPaths(twelveInchId?: string) {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/twelve-inch');
  if (twelveInchId) {
    revalidatePath(`/dashboard/twelve-inch/${twelveInchId}`);
    revalidatePath(`/dashboard/twelve-inch/${twelveInchId}/edit`);
  }
}

type PresentArtwork = Extract<
  ParsedArtworkUpload,
  { ok: true; kind: 'present' }
>;

async function persistArtwork(args: {
  pending: PresentArtwork;
  ownerId: string;
  twelveInchId: string;
  prevKey: string | null;
}) {
  const key = twelveInchArtworkRelativeKey(
    args.ownerId,
    args.twelveInchId,
    args.pending.mimeType
  );

  await writeArtworkObject(key, args.pending.buffer, args.pending.mimeType);

  await prisma.collectionTwelveInchSingle.updateMany({
    where: { id: args.twelveInchId, ownerId: args.ownerId },
    data: {
      artworkKey: key,
      artworkMimeType: args.pending.mimeType,
      artworkUpdatedAt: new Date(),
    },
  });

  if (args.prevKey && args.prevKey !== key) {
    await deleteArtworkObject(args.prevKey);
  }

  return { ok: true as const };
}

export async function createTwelveInchAction(
  _prev: TwelveInchActionState,
  formData: FormData
): Promise<TwelveInchActionState> {
  const user = await requireUser();

  const parsed = parseTwelveInchForm(formData);
  const artworkParsed = await parseArtworkFileUpload(formData.get('artwork'));

  if (!parsed.ok) return { error: parsed.error };
  if (!artworkParsed.ok) return { error: artworkParsed.error };

  let row;
  try {
    row = await createTwelveInchForOwner(user.id, parsed.data);
  } catch (e) {
    logger.error({ err: e, ownerId: user.id }, 'createTwelveInch failed');
    return { error: 'Could not save 12-inch single.' };
  }

  if (artworkParsed.kind === 'present') {
    try {
      await persistArtwork({
        pending: artworkParsed,
        ownerId: user.id,
        twelveInchId: row.id,
        prevKey: null,
      });
    } catch (e) {
      logger.error(
        { err: e, twelveInchId: row.id },
        'createTwelveInch artwork failed'
      );
      await prisma.collectionTwelveInchSingle
        .delete({ where: { id: row.id } })
        .catch(() => {});
      return {
        error:
          'Could not save sleeve art. The entry was not created. Try a smaller image.',
      };
    }
  } else if (parsed.data.spotifyTrackId?.trim()) {
    const cfg = getSpotifyIntegrationConfig();
    if (cfg.enabled) {
      const cover = await fetchSpotifyTrackCoverBuffer({
        cfg,
        trackId: parsed.data.spotifyTrackId.trim(),
      });
      if (cover) {
        const key = twelveInchArtworkRelativeKey(
          user.id,
          row.id,
          cover.mimeType
        );
        try {
          await writeArtworkObject(key, cover.buffer, cover.mimeType);
          await prisma.collectionTwelveInchSingle.update({
            where: { id: row.id },
            data: {
              artworkKey: key,
              artworkMimeType: cover.mimeType,
              artworkUpdatedAt: new Date(),
            },
          });
        } catch (e) {
          logger.warn(
            { err: e, twelveInchId: row.id },
            'createTwelveInch Spotify sleeve art failed — row saved without artwork'
          );
          await deleteArtworkObject(key).catch(() => {});
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
  revalidateTwelveInchPaths(row.id);
  redirect(`/dashboard/twelve-inch/${row.id}`);
}

export async function updateTwelveInchAction(
  _prev: TwelveInchActionState,
  formData: FormData
): Promise<TwelveInchActionState> {
  const user = await requireUser();

  const idParsed = parseTwelveInchId(formData.get('twelveInchId'));
  if (!idParsed.ok) return { error: idParsed.error };

  const existing = await getTwelveInchByIdForOwner(idParsed.id, user.id);
  if (!existing) {
    return {
      error:
        'Entry not found or you do not have permission to edit it.',
    };
  }

  const parsed = parseTwelveInchForm(formData);
  const artworkParsed = await parseArtworkFileUpload(formData.get('artwork'));
  const removeArtwork = formData.get('removeArtwork') === '1';

  if (!parsed.ok) return { error: parsed.error };
  if (!artworkParsed.ok) return { error: artworkParsed.error };

  let updated: boolean;
  try {
    updated = await updateTwelveInchForOwner(idParsed.id, user.id, parsed.data);
  } catch (e) {
    logger.error({ err: e, twelveInchId: idParsed.id }, 'updateTwelveInch failed');
    return { error: 'Could not update entry.' };
  }

  if (!updated) {
    return {
      error:
        'Entry not found or you do not have permission to update it.',
    };
  }

  try {
    if (removeArtwork) {
      const prevKey = existing.artworkKey;
      await prisma.collectionTwelveInchSingle.updateMany({
        where: { id: idParsed.id, ownerId: user.id },
        data: {
          artworkKey: null,
          artworkMimeType: null,
          artworkUpdatedAt: null,
        },
      });
      if (prevKey) await deleteArtworkObject(prevKey);
    } else if (artworkParsed.kind === 'present') {
      await persistArtwork({
        pending: artworkParsed,
        ownerId: user.id,
        twelveInchId: idParsed.id,
        prevKey: existing.artworkKey,
      });
    }
  } catch (e) {
    logger.error(
      { err: e, twelveInchId: idParsed.id },
      'updateTwelveInch artwork failed'
    );
    return {
      error:
        'Could not update sleeve art. Text fields were saved; try uploading again.',
    };
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
  revalidateTwelveInchPaths(idParsed.id);
  redirect(`/dashboard/twelve-inch/${idParsed.id}`);
}

export async function deleteTwelveInchAction(formData: FormData): Promise<void> {
  const user = await requireUser();

  const idParsed = parseTwelveInchId(formData.get('id'));
  if (!idParsed.ok) {
    redirect('/dashboard/twelve-inch?collectionError=delete-invalid-id');
  }

  try {
    const existing = await getTwelveInchByIdForOwner(idParsed.id, user.id);
    const deleted = await deleteTwelveInchForOwner(idParsed.id, user.id);
    if (!deleted) {
      redirect('/dashboard/twelve-inch?collectionError=delete-not-found');
    }
    if (existing) {
      revalidatePhysicalSlotPagesFromRow({
        storageKind: existing.storageKind,
        shelfRow: existing.shelfRow,
        shelfColumn: existing.shelfColumn,
        crateNumber: existing.crateNumber,
        boxNumber: existing.boxNumber,
        boxCustomLabel: existing.boxCustomLabel,
      });
    }
    revalidateTwelveInchPaths(idParsed.id);
  } catch (e) {
    logger.error({ err: e, twelveInchId: idParsed.id }, 'deleteTwelveInch failed');
    redirect('/dashboard/twelve-inch?collectionError=delete-failed');
  }

  redirect('/dashboard/twelve-inch');
}
