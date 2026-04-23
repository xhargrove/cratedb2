/**
 * Browser URL for 12-inch single sleeve art (`GET /api/twelve-inch/[id]/artwork`).
 */
export function twelveInchArtworkUrl(
  twelveInchId: string,
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
  return `/api/twelve-inch/${twelveInchId}/artwork${q}`;
}
