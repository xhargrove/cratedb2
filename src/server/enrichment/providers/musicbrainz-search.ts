import { ENRICHMENT_MAX_CANDIDATES } from '@/server/enrichment/constants';
import { getEnrichmentConfig } from '@/server/enrichment/config';
import { normalizeMusicBrainzReleaseSearch } from '@/server/enrichment/normalize-musicbrainz-release-search';
import { fetchMusicBrainzReleaseSearchJson } from '@/server/enrichment/providers/musicbrainz-fetch';
import { buildMusicBrainzReleaseQuery } from '@/server/enrichment/query-build';

export async function searchMusicBrainzCandidates(args: {
  artist: string;
  title: string;
}): Promise<
  | {
      ok: true;
      candidates: ReturnType<typeof normalizeMusicBrainzReleaseSearch>;
    }
  | { ok: false; error: string }
> {
  const cfg = getEnrichmentConfig();
  if (!cfg.enabled) {
    return { ok: false, error: cfg.reason };
  }

  const q = buildMusicBrainzReleaseQuery(args.artist, args.title);
  const fetched = await fetchMusicBrainzReleaseSearchJson({
    luceneQuery: q,
    userAgent: cfg.musicbrainzUserAgent,
  });

  if (!fetched.ok) {
    return { ok: false, error: fetched.error };
  }

  const candidates = normalizeMusicBrainzReleaseSearch(
    fetched.json,
    'musicbrainz',
    ENRICHMENT_MAX_CANDIDATES
  );

  return { ok: true, candidates };
}
