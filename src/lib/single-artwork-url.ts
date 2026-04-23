/**
 * Browser URL for single sleeve art (`GET /api/singles/[id]/artwork`).
 */
export function singleArtworkUrl(
  singleId: string,
  hasArtwork: boolean,
  version?: bigint | number | string | Date | null
): string | null {
  if (!hasArtwork) return null;
  let v: string | undefined;
  if (version instanceof Date) {
    v = String(version.getTime());
  } else if (version !== undefined && version !== null && version !== '') {
    v = String(version);
  }
  const q = v !== undefined ? `?v=${encodeURIComponent(v)}` : '';
  return `/api/singles/${singleId}/artwork${q}`;
}
