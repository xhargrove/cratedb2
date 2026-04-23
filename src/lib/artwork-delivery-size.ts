/** Query param `size` on `/api/.../artwork` — drives which stored derivative is served. */
export const ARTWORK_DELIVERY_SIZES = ['thumb', 'medium', 'full'] as const;

export type ArtworkDeliverySize = (typeof ARTWORK_DELIVERY_SIZES)[number];

/** Default preserves legacy behaviour (full-resolution object) when `size` is omitted. */
export function parseArtworkDeliverySize(
  raw: string | null | undefined
): ArtworkDeliverySize {
  if (raw === 'thumb' || raw === 'medium' || raw === 'full') return raw;
  return 'full';
}
