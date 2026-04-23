import { pickBestSpotifyImageUrl } from '@/server/spotify/album-images';
import type { SpotifyAlbumSummary } from '@/server/spotify/types';

function yearFromReleaseDate(date: unknown, precision: unknown): number | null {
  if (typeof date !== 'string' || date.length < 4) return null;
  const y = Number(date.slice(0, 4));
  if (!Number.isFinite(y) || y < 1900 || y > 2100) return null;
  if (precision === 'year' || precision === 'day' || precision === 'month') {
    return y;
  }
  return y;
}

const MAX_GENRE_HINT_CHARS = 200;

function genreHintFromAlbum(o: Record<string, unknown>): string | null {
  const g = o.genres;
  if (!Array.isArray(g)) return null;
  const parts = g
    .filter((x): x is string => typeof x === 'string')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  let joined = parts.join(', ');
  if (joined.length > MAX_GENRE_HINT_CHARS) {
    joined = joined.slice(0, MAX_GENRE_HINT_CHARS).trimEnd();
  }
  return joined;
}

function artistLabel(artists: unknown): string {
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
 * Maps Spotify `/v1/search` album JSON to a bounded list.
 */
export function normalizeSpotifyAlbumSearch(
  json: unknown,
  limit: number
): SpotifyAlbumSummary[] {
  if (!json || typeof json !== 'object') return [];
  const albums = (json as Record<string, unknown>).albums;
  if (!albums || typeof albums !== 'object') return [];
  const items = (albums as Record<string, unknown>).items;
  if (!Array.isArray(items)) return [];

  const out: SpotifyAlbumSummary[] = [];

  for (const item of items) {
    if (out.length >= limit) break;
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const id = typeof o.id === 'string' ? o.id : '';
    const title = typeof o.name === 'string' ? o.name.trim() : '';
    if (!id || !title) continue;

    const artist = artistLabel(o.artists);
    if (!artist) continue;

    const year = yearFromReleaseDate(o.release_date, o.release_date_precision);
    const coverUrl = pickBestSpotifyImageUrl(o.images);
    const genreHint = genreHintFromAlbum(o);

    out.push({ id, artist, title, year, coverUrl, genreHint });
  }

  return out;
}
