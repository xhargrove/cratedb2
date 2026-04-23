/** Display labels for nullable / empty facet values — aligned with collection list semantics. */

export function genreLabel(genre: string | null): string {
  const t = genre?.trim();
  if (!t) return '(no genre)';
  return t;
}
