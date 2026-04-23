import { getRecordByIdForOwner } from '@/server/records/get-by-id-for-owner';

import { searchMusicBrainzCandidates } from '@/server/enrichment/providers/musicbrainz-search';

/**
 * Loads the owned record and queries the configured metadata provider(s).
 * Owner must match — callers must pass authenticated user id only.
 */
export async function findMetadataCandidatesForRecord(args: {
  recordId: string;
  ownerId: string;
}) {
  const record = await getRecordByIdForOwner(args.recordId, args.ownerId);
  if (!record) {
    return { ok: false as const, error: 'Record not found.', candidates: [] };
  }

  const result = await searchMusicBrainzCandidates({
    artist: record.artist,
    title: record.title,
  });

  if (!result.ok) {
    return { ok: false as const, error: result.error, candidates: [] };
  }

  return {
    ok: true as const,
    error: undefined as string | undefined,
    candidates: result.candidates,
  };
}
