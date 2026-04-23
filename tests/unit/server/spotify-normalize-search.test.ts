import { describe, expect, it } from 'vitest';

import { normalizeSpotifyAlbumSearch } from '@/server/spotify/normalize-search';

describe('normalizeSpotifyAlbumSearch', () => {
  it('maps Spotify search album payload', () => {
    const json = {
      albums: {
        items: [
          {
            id: 'album1',
            name: 'Low',
            artists: [{ name: 'David Bowie' }],
            release_date: '1977-01-14',
            release_date_precision: 'day',
          },
        ],
      },
    };

    const out = normalizeSpotifyAlbumSearch(json, 10);
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({
      id: 'album1',
      artist: 'David Bowie',
      title: 'Low',
      year: 1977,
      coverUrl: null,
      genreHint: null,
    });
  });

  it('respects limit', () => {
    const json = {
      albums: {
        items: [
          {
            id: 'a',
            name: 'A',
            artists: [{ name: 'X' }],
            release_date: '2020-01-01',
            release_date_precision: 'day',
          },
          {
            id: 'b',
            name: 'B',
            artists: [{ name: 'Y' }],
            release_date: '2021-01-01',
            release_date_precision: 'day',
          },
        ],
      },
    };
    expect(normalizeSpotifyAlbumSearch(json, 1)).toHaveLength(1);
  });

  it('extracts cover URL and genre hints when present', () => {
    const json = {
      albums: {
        items: [
          {
            id: 'album-x',
            name: 'Abbey Road',
            artists: [{ name: 'The Beatles' }],
            release_date: '1969-09-26',
            release_date_precision: 'day',
            images: [
              { url: 'https://i.scdn.co/image/small', width: 64 },
              { url: 'https://i.scdn.co/image/med', width: 300 },
            ],
            genres: ['classic rock'],
          },
        ],
      },
    };

    const out = normalizeSpotifyAlbumSearch(json, 10);
    expect(out).toHaveLength(1);
    expect(out[0]?.coverUrl).toBe('https://i.scdn.co/image/med');
    expect(out[0]?.genreHint).toBe('classic rock');
  });
});
