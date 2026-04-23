import { describe, expect, it } from 'vitest';

import {
  allStoredKeysForArtworkBase,
  derivativeKeysForBaseKey,
} from '@/lib/artwork-variant-keys';

describe('derivativeKeysForBaseKey', () => {
  it('derives thumb and medium keys next to the original filename', () => {
    expect(derivativeKeysForBaseKey('owner/rec.jpg')).toEqual({
      thumb: 'owner/rec.thumb.webp',
      medium: 'owner/rec.medium.webp',
    });
  });

  it('handles keys without directory prefix', () => {
    expect(derivativeKeysForBaseKey('cover.png')).toEqual({
      thumb: 'cover.thumb.webp',
      medium: 'cover.medium.webp',
    });
  });

  it('uses full stem when filename has multiple dots', () => {
    expect(derivativeKeysForBaseKey('u/a.v2.final.jpeg')).toEqual({
      thumb: 'u/a.v2.final.thumb.webp',
      medium: 'u/a.v2.final.medium.webp',
    });
  });
});

describe('allStoredKeysForArtworkBase', () => {
  it('returns original plus derivative keys in stable order', () => {
    expect(allStoredKeysForArtworkBase('o/x.webp')).toEqual([
      'o/x.webp',
      'o/x.thumb.webp',
      'o/x.medium.webp',
    ]);
  });
});
