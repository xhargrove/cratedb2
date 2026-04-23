import type { ArtworkDeliverySize } from '@/lib/artwork-delivery-size';

/**
 * Browser URL for authenticated artwork fetch (`GET /api/records/[id]/artwork`).
 * Include a version token so replacements bust caches.
 */
export function recordArtworkUrl(
  recordId: string,
  hasArtwork: boolean,
  version?: bigint | number | string | Date | null,
  size: ArtworkDeliverySize = 'full'
): string | null {
  if (!hasArtwork) return null;
  const params = new URLSearchParams();
  if (version instanceof Date) {
    params.set('v', String(version.getTime()));
  } else if (version !== undefined && version !== null && version !== '') {
    params.set('v', String(version));
  }
  if (size !== 'full') {
    params.set('size', size);
  }
  const q = params.toString();
  return `/api/records/${recordId}/artwork${q ? `?${q}` : ''}`;
}
