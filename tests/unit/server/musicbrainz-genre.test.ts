import { describe, expect, it } from 'vitest';

import {
  extractGenreFromMbReleaseGroupPayload,
  extractGenreFromMbReleasePayload,
  pickTopTagName,
} from '@/server/enrichment/musicbrainz-genre';

describe('pickTopTagName', () => {
  it('prefers highest count', () => {
    expect(
      pickTopTagName([
        { name: 'pop', count: 2 },
        { name: 'rock', count: 50 },
      ])
    ).toBe('rock');
  });
});

describe('extractGenreFromMbReleasePayload', () => {
  it('reads release-group tags from a release object', () => {
    const genre = extractGenreFromMbReleasePayload({
      id: 'x',
      'release-group': {
        tags: [
          { name: 'indie rock', count: 10 },
          { name: 'rock', count: 5 },
        ],
      },
    });
    expect(genre).toBe('indie rock');
  });
});

describe('extractGenreFromMbReleaseGroupPayload', () => {
  it('reads tags from a release-group lookup', () => {
    const genre = extractGenreFromMbReleaseGroupPayload({
      id: 'y',
      tags: [{ name: 'jazz', count: 3 }],
    });
    expect(genre).toBe('jazz');
  });
});
