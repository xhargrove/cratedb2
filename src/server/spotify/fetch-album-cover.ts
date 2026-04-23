import { logger } from '@/lib/logger';
import {
  MAX_ARTWORK_BYTES,
  detectArtworkMimeFromBytes,
  type AllowedArtworkMimeType,
} from '@/lib/validations/artwork';
import { getClientCredentialsToken } from '@/server/spotify/access-token';
import { pickBestSpotifyImageUrl } from '@/server/spotify/album-images';
import type { SpotifyIntegrationConfig } from '@/server/spotify/config';

function isAllowedSpotifyImageUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return (
      host === 'i.scdn.co' ||
      host.endsWith('.scdn.co') ||
      host.endsWith('.spotifycdn.com')
    );
  } catch {
    return false;
  }
}

async function fetchImageBytesFromSpotifyCdn(
  imageUrl: string
): Promise<Buffer | null> {
  if (!isAllowedSpotifyImageUrl(imageUrl)) {
    return null;
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15_000);

  try {
    const res = await fetch(imageUrl, {
      method: 'GET',
      signal: ctrl.signal,
      cache: 'no-store',
    });

    const len = res.headers.get('content-length');
    if (len && Number(len) > MAX_ARTWORK_BYTES) {
      return null;
    }

    if (!res.ok) return null;

    const ab = await res.arrayBuffer();
    const buf = Buffer.from(ab);
    if (buf.length > MAX_ARTWORK_BYTES) return null;
    return buf;
  } catch (e) {
    logger.warn({ err: e }, 'fetchImageBytesFromSpotifyCdn');
    return null;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Loads album metadata from Spotify and downloads the best cover image for
 * storage (same validation as manual uploads).
 */
export async function fetchSpotifyAlbumCoverBuffer(args: {
  cfg: Extract<SpotifyIntegrationConfig, { enabled: true }>;
  albumId: string;
}): Promise<{
  buffer: Buffer;
  mimeType: AllowedArtworkMimeType;
} | null> {
  const id = args.albumId.trim();
  if (!id || id.length > 64) return null;

  const tokenRes = await getClientCredentialsToken(args.cfg);
  if (!tokenRes.ok) return null;

  const url = `https://api.spotify.com/v1/albums/${encodeURIComponent(id)}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);

  let json: unknown;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenRes.token}`,
        Accept: 'application/json',
      },
      signal: ctrl.signal,
      cache: 'no-store',
    });

    if (!res.ok) return null;

    json = await res.json();
  } catch (e) {
    logger.warn({ err: e }, 'fetchSpotifyAlbumCoverBuffer album HTTP');
    return null;
  } finally {
    clearTimeout(t);
  }

  if (!json || typeof json !== 'object') return null;
  const images = (json as Record<string, unknown>).images;
  const imageUrl = pickBestSpotifyImageUrl(images);
  if (!imageUrl) return null;

  const buf = await fetchImageBytesFromSpotifyCdn(imageUrl);
  if (!buf) return null;

  const mimeType = detectArtworkMimeFromBytes(buf);
  if (!mimeType) return null;

  return { buffer: buf, mimeType };
}
