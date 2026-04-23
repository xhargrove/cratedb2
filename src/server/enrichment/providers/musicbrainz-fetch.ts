import {
  ENRICHMENT_FETCH_TIMEOUT_MS,
  ENRICHMENT_MAX_CANDIDATES,
} from '@/server/enrichment/constants';

const MUSICBRAINZ_WS_ORIGIN = 'https://musicbrainz.org';

/**
 * Performs a GET to the MusicBrainz **release search** endpoint only.
 * Never passes user-controlled URLs — only fixed path + encoded query param.
 */
export async function fetchMusicBrainzReleaseSearchJson(args: {
  luceneQuery: string;
  userAgent: string;
}): Promise<{ ok: true; json: unknown } | { ok: false; error: string }> {
  const url = new URL('/ws/2/release', MUSICBRAINZ_WS_ORIGIN);
  url.searchParams.set('query', args.luceneQuery);
  url.searchParams.set('fmt', 'json');
  url.searchParams.set('limit', String(ENRICHMENT_MAX_CANDIDATES));

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), ENRICHMENT_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': args.userAgent,
      },
      signal: ctrl.signal,
      cache: 'no-store',
    });

    if (!res.ok) {
      return {
        ok: false,
        error: `MusicBrainz returned HTTP ${res.status}. Try again later.`,
      };
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      return { ok: false, error: 'MusicBrainz returned invalid JSON.' };
    }

    return { ok: true, json };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('abort') || ctrl.signal.aborted) {
      return {
        ok: false,
        error: 'MusicBrainz request timed out. Try again.',
      };
    }
    return {
      ok: false,
      error: 'Could not reach MusicBrainz. Check your network and try again.',
    };
  } finally {
    clearTimeout(timeout);
  }
}
