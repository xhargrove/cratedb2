import { prisma } from '@/db/client';

import type { ParsedMetadataCandidate } from '@/server/enrichment/candidate-schema';
import { getRecordByIdForOwner } from '@/server/records/get-by-id-for-owner';

export type ApplyMode = 'merge' | 'replace';

function isBlankGenre(g: string | null | undefined): boolean {
  return g === null || g === undefined || g.trim() === '';
}

/**
 * Applies a user-selected candidate with explicit merge vs replace semantics.
 *
 * **merge:** Fill only empty optional fields (`year`, `genre`). Does not change
 * artist, title, notes, storage, or artwork.
 *
 * **replace:** Overwrites artist, title, year, and genre from the candidate.
 * Notes, storage, and artwork are never modified by enrichment.
 */
export async function applyMetadataCandidateForRecord(args: {
  recordId: string;
  ownerId: string;
  candidate: ParsedMetadataCandidate;
  mode: ApplyMode;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const record = await getRecordByIdForOwner(args.recordId, args.ownerId);
  if (!record) {
    return { ok: false, error: 'Record not found or access denied.' };
  }

  const { candidate, mode } = args;
  const now = new Date();

  if (mode === 'merge') {
    const data: {
      metadataSource: string;
      metadataSourceId: string;
      metadataAppliedAt: Date;
      year?: number;
      genre?: string | null;
    } = {
      metadataSource: candidate.provider,
      metadataSourceId: candidate.id,
      metadataAppliedAt: now,
    };

    if (record.year === null && candidate.year !== null) {
      data.year = candidate.year;
    }

    if (
      isBlankGenre(record.genre) &&
      candidate.genre !== null &&
      candidate.genre.trim()
    ) {
      data.genre = candidate.genre.trim();
    }

    await prisma.collectionRecord.updateMany({
      where: { id: args.recordId, ownerId: args.ownerId },
      data,
    });

    return { ok: true };
  }

  await prisma.collectionRecord.updateMany({
    where: { id: args.recordId, ownerId: args.ownerId },
    data: {
      artist: candidate.artist,
      title: candidate.title,
      year: candidate.year ?? null,
      genre: candidate.genre?.trim() ? candidate.genre.trim() : null,
      metadataSource: candidate.provider,
      metadataSourceId: candidate.id,
      metadataAppliedAt: now,
    },
  });

  return { ok: true };
}
