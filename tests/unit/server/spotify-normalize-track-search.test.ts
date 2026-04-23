import { describe, expect, it } from 'vitest';

import { normalizeSpotifyTrackSearch } from '@/server/spotify/normalize-track-search';

describe('normalizeSpotifyTrackSearch', () => {
  it('maps track search payload', () => {
    const json = {
      tracks: {
        items: [
          {
            id: 'tr1',
            name: 'Hey Jude',
            artists: [{ name: 'The Beatles' }],
            album: {
              name: 'Hey Jude',
              release_date: '1968-08-26',
              release_date_precision: 'day',
              images: [
                { url: 'https://i.scdn.co/image/small', width: 64 },
                { url: 'https://i.scdn.co/image/med', width: 300 },
              ],
              genres: ['rock'],
            },
          },
        ],
      },
    };

    const out = normalizeSpotifyTrackSearch(json, 10);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      id: 'tr1',
      artist: 'The Beatles',
      title: 'Hey Jude',
      albumName: 'Hey Jude',
      year: 1968,
      coverUrl: 'https://i.scdn.co/image/med',
      genreHint: 'rock',
    });
  });
});
