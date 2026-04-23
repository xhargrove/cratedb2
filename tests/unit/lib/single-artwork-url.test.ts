import { describe, expect, it } from 'vitest';

import { singleArtworkUrl } from '@/lib/single-artwork-url';

describe('singleArtworkUrl', () => {
  it('returns null without artwork', () => {
    expect(singleArtworkUrl('sig1', false)).toBeNull();
  });

  it('includes version query when provided', () => {
    expect(singleArtworkUrl('sig1', true, new Date(1000))).toContain('?v=');
  });
});
