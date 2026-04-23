import type { ArtworkDeliverySize } from '@/lib/artwork-delivery-size';

/** Browser URL for 12-inch single sleeve art (`GET /api/twelve-inch/[id]/artwork`). */
export function twelveInchArtworkUrl(
  twelveInchId: string,
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
  return `/api/twelve-inch/${twelveInchId}/artwork${q ? `?${q}` : ''}`;
}
