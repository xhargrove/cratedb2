/**
 * Collection list + URL hard caps (Phase 4.5).
 *
 * **List:** `COLLECTION_LIST_MAX` is a server-side safety bound. The UI states
 * when results are capped; full pagination is deferred to a later phase.
 *
 * **Filters (genre / storageLocation):** Values are trimmed on write (Zod).
 * Matching and facets use case-insensitive equality so URL/facet labels stay
 * aligned with stored rows (PostgreSQL `mode: 'insensitive'`).
 */
export const COLLECTION_LIST_MAX = 500;

/** Owner export download (albums or singles) — hard cap per request. */
export const OWNER_EXPORT_ROW_MAX = 10_000;

/** Max length for `q` after trim (`parseCollectionSearchParams`). */
export const MAX_SEARCH_Q_LENGTH = 200;

/** Align with record / single form string field max lengths for URL param safety. */
export const MAX_GENRE_URL_LENGTH = 200;
export const MAX_STORAGE_URL_LENGTH = 500;

/** Physical storage containers (shelf / box / crate). */
export const CONTAINER_NAME_MAX = 120;
export const CONTAINER_LOCATION_NOTE_MAX = 500;
