import { pickBestSpotifyImageUrl } from '@/server/spotify/album-images';
import type { SpotifyTrackSummary } from '@/server/spotify/types';

function yearFromAlbum(album: Record<string, unknown>): number | null {
  const date = album.release_date;
  const precision = album.release_date_precision;
  if (typeof date !== 'string' || date.length < 4) return null;
  const y = Number(date.slice(0, 4));
  if (!Number.isFinite(y) || y < 1900 || y > 2100) return null;
  if (precision === 'year' || precision === 'day' || precision === 'month') {
    return y;
  }
  return y;
}

function genreHintFromAlbum(album: Record<string, unknown>): string | null {
  const MAX = 200;
  const g = album.genres;
  if (!Array.isArray(g)) return null;
  const parts = g
    .filter((x): x is string => typeof x === 'string')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  let joined = parts.join(', ');
  if (joined.length > MAX) joined = joined.slice(0, MAX).trimEnd();
  return joined;
}

function artistsLabel(artists: unknown): string {
  if (!Array.isArray(artists)) return '';
  const names = artists
    .map((a) => {
      if (!a || typeof a !== 'object') return '';
      const n = (a as Record<string, unknown>).name;
      return typeof n === 'string' ? n.trim() : '';
    })
    .filter(Boolean);
  return names.join(', ');
}

/**
 * Maps Spotify `/v1/search` track JSON to a bounded list.
 */
export function normalizeSpotifyTrackSearch(
  json: unknown,
  limit: number
): SpotifyTrackSummary[] {
  if (!json || typeof json !== 'object') return [];
  const tracks = (json as Record<string, unknown>).tracks;
  if (!tracks || typeof tracks !== 'object') return [];
  const items = (tracks as Record<string, unknown>).items;
  if (!Array.isArray(items)) return [];

  const out: SpotifyTrackSummary[] = [];

  for (const item of items) {
    if (out.length >= limit) break;
    if (!item || typeof item !== 'object') continue;
    const t = item as Record<string, unknown>;
    const id = typeof t.id === 'string' ? t.id : '';
    const title = typeof t.name === 'string' ? t.name.trim() : '';
    if (!id || !title) continue;

    const artist = artistsLabel(t.artists);
    if (!artist) continue;

    const albumRaw = t.album;
    let albumName: string | null = null;
    let year: number | null = null;
    let coverUrl: string | null = null;
    let genreHint: string | null = null;

    if (albumRaw && typeof albumRaw === 'object') {
      const alb = albumRaw as Record<string, unknown>;
      albumName =
        typeof alb.name === 'string' && alb.name.trim()
          ? alb.name.trim().slice(0, 500)
          : null;
      year = yearFromAlbum(alb);
      coverUrl = pickBestSpotifyImageUrl(alb.images);
      genreHint = genreHintFromAlbum(alb);
    }

    out.push({
      id,
      artist,
      title,
      albumName,
      year,
      coverUrl,
      genreHint,
    });
  }

  return out;
}
