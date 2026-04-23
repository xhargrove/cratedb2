/**
 * Canonical normalization for wantlist duplicate detection and ownership checks.
 * Align artist/title/year identity across wantlist rows and collection records.
 */
export function normalizeWantlistToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Stable per-owner uniqueness key (stored on `WantlistItem.dedupeKey`).
 * Year: absent/null uses a sentinel so “unknown year” wish matches one dedupe bucket.
 */
export function buildWantlistDedupeKey(
  artist: string,
  title: string,
  year: number | null | undefined
): string {
  const a = normalizeWantlistToken(artist);
  const t = normalizeWantlistToken(title);
  const y = year === null || year === undefined ? '__year__' : String(year);
  return `${a}\u001f${t}\u001f${y}`;
}
