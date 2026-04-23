import sharp from 'sharp';

import { logger } from '@/lib/logger';

/** Max dimension (px) — `fit: inside` preserves aspect ratio. */
export const ARTWORK_THUMB_MAX_PX = 320;
export const ARTWORK_MEDIUM_MAX_PX = 900;

/**
 * Raster derivatives as WebP for grid/list/detail bandwidth savings.
 * Returns null if Sharp cannot process the buffer (caller keeps original-only).
 */
export async function generateArtworkDerivatives(buffer: Buffer): Promise<{
  thumb: Buffer;
  medium: Buffer;
} | null> {
  try {
    const thumb = await sharp(buffer)
      .rotate()
      .resize(ARTWORK_THUMB_MAX_PX, ARTWORK_THUMB_MAX_PX, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 78 })
      .toBuffer();

    const medium = await sharp(buffer)
      .rotate()
      .resize(ARTWORK_MEDIUM_MAX_PX, ARTWORK_MEDIUM_MAX_PX, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();

    return { thumb, medium };
  } catch (err) {
    logger.warn({ err }, 'generateArtworkDerivatives failed');
    return null;
  }
}
