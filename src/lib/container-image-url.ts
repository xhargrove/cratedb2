/** Authenticated container cover (`GET /api/containers/[id]/image`). */
export function containerImageUrl(
  containerId: string,
  hasImage: boolean,
  version?: bigint | number | string | Date | null
): string | null {
  if (!hasImage) return null;
  let v: string | undefined;
  if (version instanceof Date) {
    v = String(version.getTime());
  } else if (version !== undefined && version !== null && version !== '') {
    v = String(version);
  }
  const q = v !== undefined ? `?v=${encodeURIComponent(v)}` : '';
  return `/api/containers/${containerId}/image${q}`;
}
