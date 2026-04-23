import type { SpotifyIntegrationConfig } from '@/server/spotify/config';

const TOKEN_URL = 'https://accounts.spotify.com/api/token';

let cache: { token: string; expiresAtMs: number } | null = null;

/**
 * Client-credentials access token (no end-user Spotify login).
 * Cached until shortly before expiry.
 */
export async function getClientCredentialsToken(
  cfg: Extract<SpotifyIntegrationConfig, { enabled: true }>
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const now = Date.now();
  if (cache && cache.expiresAtMs > now + 5000) {
    return { ok: true, token: cache.token };
  }

  const basic = Buffer.from(
    `${cfg.clientId}:${cfg.clientSecret}`,
    'utf8'
  ).toString('base64');

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);

  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      signal: ctrl.signal,
      cache: 'no-store',
    });

    if (!res.ok) {
      return {
        ok: false,
        error:
          res.status === 401 || res.status === 403
            ? 'Spotify rejected credentials. Check SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.'
            : `Spotify token request failed (${res.status}).`,
      };
    }

    const json = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
    };

    const token = json.access_token;
    const expiresIn = json.expires_in;
    if (typeof token !== 'string' || typeof expiresIn !== 'number') {
      return { ok: false, error: 'Unexpected Spotify token response.' };
    }

    const expiresAtMs = now + Math.max(60, expiresIn - 60) * 1000;
    cache = { token, expiresAtMs };

    return { ok: true, token };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('abort')) {
      return { ok: false, error: 'Spotify login request timed out.' };
    }
    return { ok: false, error: 'Could not reach Spotify accounts API.' };
  } finally {
    clearTimeout(t);
  }
}
