import { logger } from '@/lib/logger';
import { getClientCredentialsToken } from '@/server/spotify/access-token';
import type { SpotifyIntegrationConfig } from '@/server/spotify/config';
import { normalizeSpotifyAlbumSearch } from '@/server/spotify/normalize-search';
import type { SpotifyAlbumSummary } from '@/server/spotify/types';

const SEARCH_URL = 'https://api.spotify.com/v1/search';

export const SPOTIFY_SEARCH_MAX_QUERY_CHARS = 200;
export const SPOTIFY_SEARCH_MAX_RESULTS = 10;

function buildSearchUrl(query: string): string {
  const url = new URL(SEARCH_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'album');
  url.searchParams.set('limit', String(SPOTIFY_SEARCH_MAX_RESULTS));
  return url.toString();
}

export async function searchSpotifyAlbums(args: {
  cfg: Extract<SpotifyIntegrationConfig, { enabled: true }>;
  query: string;
}): Promise<
  { ok: true; albums: SpotifyAlbumSummary[] } | { ok: false; error: string }
> {
  const q = args.query.trim();
  if (q.length === 0) {
    return { ok: false, error: 'Enter a search query.' };
  }
  if (q.length > SPOTIFY_SEARCH_MAX_QUERY_CHARS) {
    return {
      ok: false,
      error: `Search is limited to ${SPOTIFY_SEARCH_MAX_QUERY_CHARS} characters.`,
    };
  }

  const tokenRes = await getClientCredentialsToken(args.cfg);
  if (!tokenRes.ok) {
    return tokenRes;
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);

  try {
    const res = await fetch(buildSearchUrl(q), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenRes.token}`,
        Accept: 'application/json',
      },
      signal: ctrl.signal,
      cache: 'no-store',
    });

    if (res.status === 429) {
      return {
        ok: false,
        error: 'Spotify rate limit — wait a moment and try again.',
      };
    }

    if (!res.ok) {
      logger.warn({ status: res.status }, 'Spotify search HTTP error');
      return {
        ok: false,
        error: `Spotify search failed (${res.status}).`,
      };
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      return { ok: false, error: 'Spotify returned invalid JSON.' };
    }

    const albums = normalizeSpotifyAlbumSearch(
      json,
      SPOTIFY_SEARCH_MAX_RESULTS
    );

    return { ok: true, albums };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('abort')) {
      return { ok: false, error: 'Spotify search timed out.' };
    }
    return { ok: false, error: 'Could not reach Spotify API.' };
  } finally {
    clearTimeout(t);
  }
}
