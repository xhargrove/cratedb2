/**
 * Enrichment is opt-in and never required for CRUD.
 *
 * When disabled, UI hides controls and server actions return a stable message.
 *
 * MusicBrainz requires a descriptive User-Agent with contact info:
 * https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting
 */

export type EnrichmentConfig =
  | { enabled: false; reason: string }
  | {
      enabled: true;
      /** Full User-Agent sent to MusicBrainz (must identify this app + contact). */
      musicbrainzUserAgent: string;
    };

function trimEnv(key: string): string | undefined {
  const v = process.env[key];
  if (v === undefined || v === null) return undefined;
  const t = v.trim();
  return t === '' ? undefined : t;
}

/**
 * Reads env without throwing — safe for UI gating.
 * Not cached so tests can stub env between runs.
 */
export function getEnrichmentConfig(): EnrichmentConfig {
  const enabledFlag = trimEnv('ENRICHMENT_ENABLED');
  if (enabledFlag !== 'true') {
    return {
      enabled: false,
      reason:
        'Metadata enrichment is disabled. Set ENRICHMENT_ENABLED=true and MUSICBRAINZ_CONTACT to enable.',
    };
  }

  const contact = trimEnv('MUSICBRAINZ_CONTACT');
  if (!contact) {
    return {
      enabled: false,
      reason:
        'MusicBrainz requires a contact User-Agent. Set MUSICBRAINZ_CONTACT (e.g. your email or project URL).',
    };
  }

  const ua =
    trimEnv('MUSICBRAINZ_USER_AGENT') ??
    `Cratedb/0.1 (+https://github.com) (${contact})`;

  return {
    enabled: true,
    musicbrainzUserAgent: ua.slice(0, 500),
  };
}
