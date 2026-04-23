import {
  ENRICHMENT_MAX_QUERY_CHARS,
  ENRICHMENT_MAX_QUERY_PART_CHARS,
} from '@/server/enrichment/constants';

function luceneEscapePhrase(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max).trimEnd();
}

/**
 * Builds a bounded Lucene query for MusicBrainz release search.
 * Does not fetch URLs — caller passes only artist/title strings from owned records.
 */
export function buildMusicBrainzReleaseQuery(
  artist: string,
  title: string
): string {
  const a = truncate(
    luceneEscapePhrase(artist.trim()),
    ENRICHMENT_MAX_QUERY_PART_CHARS
  );
  const t = truncate(
    luceneEscapePhrase(title.trim()),
    ENRICHMENT_MAX_QUERY_PART_CHARS
  );
  let q = `artist:"${a}" AND release:"${t}"`;
  if (q.length <= ENRICHMENT_MAX_QUERY_CHARS) return q;
  q = `release:"${t}"`;
  if (q.length <= ENRICHMENT_MAX_QUERY_CHARS) return q;
  return truncate(q, ENRICHMENT_MAX_QUERY_CHARS);
}
