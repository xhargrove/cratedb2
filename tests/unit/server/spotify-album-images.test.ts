import { describe, expect, it } from 'vitest';

import { pickBestSpotifyImageUrl } from '@/server/spotify/album-images';

describe('pickBestSpotifyImageUrl', () => {
  it('prefers dimensions near 300px wide', () => {
    const url = pickBestSpotifyImageUrl([
      { url: 'https://i.scdn.co/image/a', width: 64 },
      { url: 'https://i.scdn.co/image/b', width: 300 },
      { url: 'https://i.scdn.co/image/c', width: 640 },
    ]);
    expect(url).toBe('https://i.scdn.co/image/b');
  });

  it('returns null for empty input', () => {
    expect(pickBestSpotifyImageUrl([])).toBeNull();
    expect(pickBestSpotifyImageUrl(null)).toBeNull();
  });
});
