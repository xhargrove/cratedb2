/**
 * Spotify Web API — optional integration (server-side client credentials only).
 * https://developer.spotify.com/documentation/web-api/tutorials/client-credentials-flow
 */

export type SpotifyIntegrationConfig =
  | { enabled: true; clientId: string; clientSecret: string }
  | { enabled: false; reason: string };

export function getSpotifyIntegrationConfig(): SpotifyIntegrationConfig {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return {
      enabled: false,
      reason:
        'Spotify search is off. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET (Developer Dashboard → app → Client ID / Client secret).',
    };
  }

  return { enabled: true, clientId, clientSecret };
}
