import { describe, expect, it, vi, afterEach } from 'vitest';

import { fetchMusicBrainzReleaseSearchJson } from '@/server/enrichment/providers/musicbrainz-fetch';

describe('fetchMusicBrainzReleaseSearchJson', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requests only the MusicBrainz release search path', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ releases: [] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchMusicBrainzReleaseSearchJson({
      luceneQuery: 'artist:"X"',
      userAgent: 'Test/1 (test@example.com)',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url.startsWith('https://musicbrainz.org/ws/2/release')).toBe(true);
    expect(url).toContain('fmt=json');
    expect(url).toContain('limit=');
  });

  it('returns error on non-OK HTTP', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      })
    );

    const out = await fetchMusicBrainzReleaseSearchJson({
      luceneQuery: 'release:test',
      userAgent: 'Test/1',
    });

    expect(out.ok).toBe(false);
    if (!out.ok) {
      expect(out.error).toContain('503');
    }
  });
});
