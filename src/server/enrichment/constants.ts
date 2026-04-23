/** Safety caps for outbound MusicBrainz search (Phase 9). */

export const ENRICHMENT_MAX_CANDIDATES = 10;

/** Total budget for Lucene query string built from artist + title. */
export const ENRICHMENT_MAX_QUERY_CHARS = 180;

/** Single-field slice when composing query parts. */
export const ENRICHMENT_MAX_QUERY_PART_CHARS = 80;

/** Abort external fetch after this many milliseconds. */
export const ENRICHMENT_FETCH_TIMEOUT_MS = 12_000;
