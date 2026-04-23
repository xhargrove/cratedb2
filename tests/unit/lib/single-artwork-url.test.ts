import { describe, expect, it } from 'vitest';

import { singleArtworkUrl } from '@/lib/single-artwork-url';

describe('singleArtworkUrl', () => {
  it('returns null without artwork', () => {
    expect(singleArtworkUrl('sig1', false)).toBeNull();
  });

  it('includes version query when provided', () => {
    expect(singleArtworkUrl('sig1', true, new Date(1000))).toContain('?v=');
  });

  it('includes size for thumb and medium', () => {
    expect(singleArtworkUrl('sig1', true, null, 'thumb')).toContain(
      'size=thumb'
    );
    expect(singleArtworkUrl('sig1', true, 5, 'medium')).toBe(
      '/api/singles/sig1/artwork?v=5&size=medium'
    );
  });
});
