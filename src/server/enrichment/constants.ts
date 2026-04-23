/** Safety caps for outbound MusicBrainz search (Phase 9). */

export const ENRICHMENT_MAX_CANDIDATES = 10;

/** Total budget for Lucene query string built from artist + title. */
export const ENRICHMENT_MAX_QUERY_CHARS = 180;

/** Single-field slice when composing query parts. */
export const ENRICHMENT_MAX_QUERY_PART_CHARS = 80;

/** Abort external fetch after this many milliseconds. */
export const ENRICHMENT_FETCH_TIMEOUT_MS = 12_000;

/** MusicBrainz UUID (release / release-group). */
export const MUSICBRAINZ_MBID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Pause between MusicBrainz requests (rate-limit etiquette). */
export const MUSICBRAINZ_REQUEST_GAP_MS = 1100;
