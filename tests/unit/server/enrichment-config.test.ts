import { afterEach, describe, expect, it, vi } from 'vitest';

describe('getEnrichmentConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('is disabled when ENRICHMENT_ENABLED is not true', async () => {
    vi.stubEnv('ENRICHMENT_ENABLED', '');
    const { getEnrichmentConfig } = await import('@/server/enrichment/config');
    const cfg = getEnrichmentConfig();
    expect(cfg.enabled).toBe(false);
  });

  it('is disabled when MUSICBRAINZ_CONTACT is missing', async () => {
    vi.stubEnv('ENRICHMENT_ENABLED', 'true');
    vi.stubEnv('MUSICBRAINZ_CONTACT', '');
    const { getEnrichmentConfig } = await import('@/server/enrichment/config');
    const cfg = getEnrichmentConfig();
    expect(cfg.enabled).toBe(false);
  });

  it('is enabled with contact set', async () => {
    vi.stubEnv('ENRICHMENT_ENABLED', 'true');
    vi.stubEnv('MUSICBRAINZ_CONTACT', 'ops@example.com');
    const { getEnrichmentConfig } = await import('@/server/enrichment/config');
    const cfg = getEnrichmentConfig();
    expect(cfg.enabled).toBe(true);
    if (cfg.enabled) {
      expect(cfg.musicbrainzUserAgent).toContain('ops@example.com');
    }
  });
});
