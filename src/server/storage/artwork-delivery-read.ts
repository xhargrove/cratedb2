import type { ArtworkDeliverySize } from '@/lib/artwork-delivery-size';
import type { AllowedArtworkMimeType } from '@/lib/validations/artwork';
import { derivativeKeysForBaseKey } from '@/lib/artwork-variant-keys';
import { readArtworkObject } from '@/server/storage/artwork-store';

function toUint8Array(buf: Buffer | Uint8Array): Uint8Array {
  return buf instanceof Buffer ? new Uint8Array(buf) : buf;
}

/**
 * Reads the requested delivery size; falls back to the original upload when derivatives
 * are missing (legacy rows before variants existed).
 */
export async function readArtworkForDelivery(
  baseKey: string,
  baseMime: AllowedArtworkMimeType,
  size: ArtworkDeliverySize
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  if (size === 'full') {
    const o = await readArtworkObject(baseKey);
    if (!o?.buffer) return null;
    return {
      bytes: toUint8Array(
        o.buffer instanceof Buffer ? o.buffer : Buffer.from(o.buffer)
      ),
      contentType: baseMime,
    };
  }

  const variantKey =
    size === 'thumb'
      ? derivativeKeysForBaseKey(baseKey).thumb
      : derivativeKeysForBaseKey(baseKey).medium;

  const variant = await readArtworkObject(variantKey);
  if (variant?.buffer) {
    const buf =
      variant.buffer instanceof Buffer
        ? variant.buffer
        : Buffer.from(variant.buffer);
    return { bytes: toUint8Array(buf), contentType: 'image/webp' };
  }

  const original = await readArtworkObject(baseKey);
  if (!original?.buffer) return null;
  const buf =
    original.buffer instanceof Buffer
      ? original.buffer
      : Buffer.from(original.buffer);
  return { bytes: toUint8Array(buf), contentType: baseMime };
}
