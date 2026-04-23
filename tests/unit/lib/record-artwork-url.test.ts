import { describe, expect, it } from 'vitest';

import { recordArtworkUrl } from '@/lib/record-artwork-url';

describe('recordArtworkUrl', () => {
  it('returns null when no artwork', () => {
    expect(recordArtworkUrl('rid', false)).toBeNull();
  });

  it('builds API path with optional version', () => {
    expect(recordArtworkUrl('abc', true)).toBe('/api/records/abc/artwork');
    expect(recordArtworkUrl('abc', true, 12345)).toBe(
      '/api/records/abc/artwork?v=12345'
    );
    expect(recordArtworkUrl('abc', true, new Date(1000))).toBe(
      '/api/records/abc/artwork?v=1000'
    );
  });

  it('adds size query for non-full delivery', () => {
    expect(recordArtworkUrl('abc', true, null, 'thumb')).toBe(
      '/api/records/abc/artwork?size=thumb'
    );
    expect(recordArtworkUrl('abc', true, 1, 'medium')).toBe(
      '/api/records/abc/artwork?v=1&size=medium'
    );
  });
});
