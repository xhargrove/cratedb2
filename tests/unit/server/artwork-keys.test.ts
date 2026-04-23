import { describe, expect, it } from 'vitest';

import {
  artworkRelativeKey,
  assertValidArtworkKey,
  containerImageRelativeKey,
  profileImageRelativeKey,
  singleArtworkRelativeKey,
  twelveInchArtworkRelativeKey,
} from '@/server/storage/artwork-keys';

describe('artwork-keys', () => {
  it('builds stable keys for each collection type', () => {
    expect(artworkRelativeKey('owner1', 'record1', 'image/jpeg')).toBe(
      'owner1/record1.jpg'
    );
    expect(singleArtworkRelativeKey('owner1', 'single1', 'image/png')).toBe(
      'owner1/singles/single1.png'
    );
    expect(
      twelveInchArtworkRelativeKey('owner1', 'maxi1', 'image/webp')
    ).toBe('owner1/twelve-inch/maxi1.webp');
    expect(profileImageRelativeKey('owner1', 'image/gif')).toBe(
      'owner1/profile.gif'
    );
    expect(containerImageRelativeKey('owner1', 'cont1', 'image/jpeg')).toBe(
      'owner1/containers/cont1.jpg'
    );
  });

  it('rejects invalid object keys', () => {
    expect(() => assertValidArtworkKey('../evil')).toThrow();
    expect(() => assertValidArtworkKey('/abs/path')).toThrow();
    expect(() => assertValidArtworkKey('bad key.jpg')).toThrow();
  });
});

