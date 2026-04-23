import { describe, expect, it } from 'vitest';

import {
  formatArtistCredit,
  normalizeMusicBrainzReleaseSearch,
} from '@/server/enrichment/normalize-musicbrainz-release-search';

describe('formatArtistCredit', () => {
  it('joins names with joinphrases', () => {
    const s = formatArtistCredit([
      { name: 'A', joinphrase: '' },
      { joinphrase: ' & ', name: 'B' },
    ]);
    expect(s).toContain('A');
    expect(s).toContain('&');
    expect(s).toContain('B');
  });
});

describe('normalizeMusicBrainzReleaseSearch', () => {
  it('maps releases with dates and skips invalid ids', () => {
    const json = {
      releases: [
        {
          id: 'not-a-uuid',
          title: 'Bad',
          'artist-credit': [{ name: 'X', joinphrase: '' }],
        },
        {
          id: 'c47e6051-2647-4daa-b16e-7ff419b9e570',
          title: 'Low',
          date: '1977-01-14',
          'artist-credit': [{ name: 'David Bowie', joinphrase: '' }],
        },
      ],
    };

    const out = normalizeMusicBrainzReleaseSearch(json, 'musicbrainz', 10);
    expect(out).toHaveLength(1);
    expect(out[0]?.title).toBe('Low');
    expect(out[0]?.year).toBe(1977);
    expect(out[0]?.provider).toBe('musicbrainz');
  });
});
