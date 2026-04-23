import type { ArtworkDeliverySize } from '@/lib/artwork-delivery-size';

/** Browser URL for single sleeve art (`GET /api/singles/[id]/artwork`). */
export function singleArtworkUrl(
  singleId: string,
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
  return `/api/singles/${singleId}/artwork${q ? `?${q}` : ''}`;
}
