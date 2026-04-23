const MAX_GENRE_CHARS = 200;

/**
 * Picks the highest-count tag name from MusicBrainz `tags[]` (release-group or
 * standalone release-group lookup).
 */
export function pickTopTagName(tags: unknown): string | null {
  if (!Array.isArray(tags) || tags.length === 0) return null;
  const scored = tags
    .map((t) => {
      if (!t || typeof t !== 'object') return null;
      const o = t as Record<string, unknown>;
      const name = typeof o.name === 'string' ? o.name.trim() : '';
      const count =
        typeof o.count === 'number' && Number.isFinite(o.count) ? o.count : 0;
      return name ? { name, count } : null;
    })
    .filter((x): x is { name: string; count: number } => Boolean(x));
  scored.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const top = scored[0];
  if (!top) return null;
  return top.name.slice(0, MAX_GENRE_CHARS);
}

/** Genre from a release payload (`release-group.tags`) — search or lookup. */
export function extractGenreFromMbReleasePayload(
  payload: unknown
): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const rel = payload as Record<string, unknown>;
  const rg = rel['release-group'];
  if (!rg || typeof rg !== 'object') return null;
  return pickTopTagName((rg as Record<string, unknown>).tags);
}

/** Genre from a release-group lookup (`tags` on the entity). */
export function extractGenreFromMbReleaseGroupPayload(
  payload: unknown
): string | null {
  if (!payload || typeof payload !== 'object') return null;
  return pickTopTagName((payload as Record<string, unknown>).tags);
}
