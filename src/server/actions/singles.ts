'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { prisma } from '@/db/client';
import { logger } from '@/lib/logger';
import {
  parseArtworkFileUpload,
  type ParsedArtworkUpload,
} from '@/lib/validations/artwork';
import { parseSingleForm, parseSingleId } from '@/lib/validations/single';
import { requireUser } from '@/server/auth/require-user';
import {
  deleteArtworkFile,
  singleArtworkRelativeKey,
  writeArtworkFile,
} from '@/server/storage/local-artwork-store';
import { getSpotifyIntegrationConfig } from '@/server/spotify/config';
import { fetchSpotifyTrackCoverBuffer } from '@/server/spotify/fetch-album-cover';
import { createSingleForOwner } from '@/server/singles/create';
import { deleteSingleForOwner } from '@/server/singles/delete';
import { getSingleByIdForOwner } from '@/server/singles/get-by-id-for-owner';
import { updateSingleForOwner } from '@/server/singles/update';

export type SingleActionState = { error?: string } | null;

function revalidateSinglePaths(singleId?: string) {
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/singles');
  if (singleId) {
    revalidatePath(`/dashboard/singles/${singleId}`);
    revalidatePath(`/dashboard/singles/${singleId}/edit`);
  }
}

type PresentArtwork = Extract<
  ParsedArtworkUpload,
  { ok: true; kind: 'present' }
>;

async function persistArtworkForSingle(args: {
  pending: PresentArtwork;
  ownerId: string;
  singleId: string;
  prevKey: string | null;
}) {
  const key = singleArtworkRelativeKey(
    args.ownerId,
    args.singleId,
    args.pending.mimeType
  );

  await writeArtworkFile(key, args.pending.buffer);

  await prisma.collectionSingle.updateMany({
    where: { id: args.singleId, ownerId: args.ownerId },
    data: {
      artworkKey: key,
      artworkMimeType: args.pending.mimeType,
      artworkUpdatedAt: new Date(),
    },
  });

  if (args.prevKey && args.prevKey !== key) {
    await deleteArtworkFile(args.prevKey);
  }

  return { ok: true as const };
}

export async function createSingleAction(
  _prev: SingleActionState,
  formData: FormData
): Promise<SingleActionState> {
  const user = await requireUser();

  const parsed = parseSingleForm(formData);
  const artworkParsed = await parseArtworkFileUpload(formData.get('artwork'));

  if (!parsed.ok) return { error: parsed.error };
  if (!artworkParsed.ok) return { error: artworkParsed.error };

  let single;
  try {
    single = await createSingleForOwner(user.id, parsed.data);
  } catch (e) {
    logger.error({ err: e, ownerId: user.id }, 'createSingle failed');
    return { error: 'Could not save single.' };
  }

  if (artworkParsed.kind === 'present') {
    try {
      await persistArtworkForSingle({
        pending: artworkParsed,
        ownerId: user.id,
        singleId: single.id,
        prevKey: null,
      });
    } catch (e) {
      logger.error({ err: e, singleId: single.id }, 'createSingle artwork failed');
      await prisma.collectionSingle.delete({ where: { id: single.id } }).catch(() => {});
      return {
        error:
          'Could not save sleeve art. The single was not created. Try a smaller image.',
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
        const key = singleArtworkRelativeKey(
          user.id,
          single.id,
          cover.mimeType
        );
        try {
          await writeArtworkFile(key, cover.buffer);
          await prisma.collectionSingle.update({
            where: { id: single.id },
            data: {
              artworkKey: key,
              artworkMimeType: cover.mimeType,
              artworkUpdatedAt: new Date(),
            },
          });
        } catch (e) {
          logger.warn(
            { err: e, singleId: single.id },
            'createSingle Spotify sleeve art failed — single saved without artwork'
          );
          await deleteArtworkFile(key).catch(() => {});
        }
      }
    }
  }

  revalidateSinglePaths(single.id);
  redirect(`/dashboard/singles/${single.id}`);
}

export async function updateSingleAction(
  _prev: SingleActionState,
  formData: FormData
): Promise<SingleActionState> {
  const user = await requireUser();

  const idParsed = parseSingleId(formData.get('singleId'));
  if (!idParsed.ok) return { error: idParsed.error };

  const existing = await getSingleByIdForOwner(idParsed.id, user.id);
  if (!existing) {
    return { error: 'Single not found or you do not have permission to edit it.' };
  }

  const parsed = parseSingleForm(formData);
  const artworkParsed = await parseArtworkFileUpload(formData.get('artwork'));
  const removeArtwork = formData.get('removeArtwork') === '1';

  if (!parsed.ok) return { error: parsed.error };
  if (!artworkParsed.ok) return { error: artworkParsed.error };

  let updated: boolean;
  try {
    updated = await updateSingleForOwner(idParsed.id, user.id, parsed.data);
  } catch (e) {
    logger.error({ err: e, singleId: idParsed.id }, 'updateSingle failed');
    return { error: 'Could not update single.' };
  }

  if (!updated) {
    return { error: 'Single not found or you do not have permission to update it.' };
  }

  try {
    if (removeArtwork) {
      const prevKey = existing.artworkKey;
      await prisma.collectionSingle.updateMany({
        where: { id: idParsed.id, ownerId: user.id },
        data: {
          artworkKey: null,
          artworkMimeType: null,
          artworkUpdatedAt: null,
        },
      });
      if (prevKey) await deleteArtworkFile(prevKey);
    } else if (artworkParsed.kind === 'present') {
      await persistArtworkForSingle({
        pending: artworkParsed,
        ownerId: user.id,
        singleId: idParsed.id,
        prevKey: existing.artworkKey,
      });
    }
  } catch (e) {
    logger.error({ err: e, singleId: idParsed.id }, 'updateSingle artwork failed');
    return {
      error:
        'Could not update sleeve art. Text fields were saved; try uploading again.',
    };
  }

  revalidateSinglePaths(idParsed.id);
  redirect(`/dashboard/singles/${idParsed.id}`);
}

export async function deleteSingleAction(formData: FormData): Promise<void> {
  const user = await requireUser();

  const idParsed = parseSingleId(formData.get('id'));
  if (!idParsed.ok) {
    redirect('/dashboard/singles?collectionError=delete-invalid-id');
  }

  try {
    const deleted = await deleteSingleForOwner(idParsed.id, user.id);
    if (!deleted) {
      redirect('/dashboard/singles?collectionError=delete-not-found');
    }
    revalidateSinglePaths(idParsed.id);
  } catch (e) {
    logger.error({ err: e, singleId: idParsed.id }, 'deleteSingle failed');
    redirect('/dashboard/singles?collectionError=delete-failed');
  }

  redirect('/dashboard/singles');
}
