import { describe, expect, it } from 'vitest';

import { twelveInchArtworkUrl } from '@/lib/twelve-inch-artwork-url';

describe('twelveInchArtworkUrl', () => {
  it('returns null without artwork', () => {
    expect(twelveInchArtworkUrl('t1', false)).toBeNull();
  });

  it('defaults to full size (no size param)', () => {
    expect(twelveInchArtworkUrl('t1', true)).toBe(
      '/api/twelve-inch/t1/artwork'
    );
  });

  it('includes size for variants', () => {
    expect(twelveInchArtworkUrl('t1', true, null, 'thumb')).toBe(
      '/api/twelve-inch/t1/artwork?size=thumb'
    );
  });
});
