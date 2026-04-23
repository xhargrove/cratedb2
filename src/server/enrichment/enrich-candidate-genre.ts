import type { ParsedMetadataCandidate } from '@/server/enrichment/candidate-schema';
import {
  MUSICBRAINZ_MBID_RE,
  MUSICBRAINZ_REQUEST_GAP_MS,
} from '@/server/enrichment/constants';
import {
  extractGenreFromMbReleaseGroupPayload,
  extractGenreFromMbReleasePayload,
} from '@/server/enrichment/musicbrainz-genre';
import {
  fetchMusicBrainzReleaseGroupLookupJson,
  fetchMusicBrainzReleaseLookupJson,
} from '@/server/enrichment/providers/musicbrainz-fetch';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * MusicBrainz Lucene search often returns releases **without** `release-group.tags`.
 * Before applying metadata, fetch the release (and optionally the release-group) so
 * we can attach the top community tag as **genre** when present.
 */
export async function enrichCandidateGenreBeforeApply(args: {
  candidate: ParsedMetadataCandidate;
  userAgent: string;
}): Promise<ParsedMetadataCandidate> {
  const { candidate, userAgent } = args;
  if (candidate.genre?.trim()) return candidate;

  const releaseRes = await fetchMusicBrainzReleaseLookupJson({
    mbid: candidate.id,
    userAgent,
  });
  if (!releaseRes.ok) return candidate;

  let genre = extractGenreFromMbReleasePayload(releaseRes.json);

  if (
    !genre?.trim() &&
    releaseRes.json &&
    typeof releaseRes.json === 'object'
  ) {
    const rg = (releaseRes.json as Record<string, unknown>)['release-group'];
    if (rg && typeof rg === 'object') {
      const rgId = (rg as Record<string, unknown>).id;
      if (typeof rgId === 'string' && MUSICBRAINZ_MBID_RE.test(rgId)) {
        await delay(MUSICBRAINZ_REQUEST_GAP_MS);
        const rgRes = await fetchMusicBrainzReleaseGroupLookupJson({
          mbid: rgId,
          userAgent,
        });
        if (rgRes.ok) {
          genre = extractGenreFromMbReleaseGroupPayload(rgRes.json);
        }
      }
    }
  }

  const g = genre?.trim();
  if (!g) return candidate;
  return { ...candidate, genre: g.slice(0, 200) };
}
