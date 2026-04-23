/**
 * Browser URL for authenticated artwork fetch (`GET /api/records/[id]/artwork`).
 * Include a version token so replacements bust caches.
 */
export function recordArtworkUrl(
  recordId: string,
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
  return `/api/records/${recordId}/artwork${q}`;
}
