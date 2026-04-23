import { describe, expect, it } from 'vitest';

import { genreLabel } from '@/server/stats/labels';

describe('genreLabel', () => {
  it('maps null and blank to (no genre)', () => {
    expect(genreLabel(null)).toBe('(no genre)');
    expect(genreLabel('')).toBe('(no genre)');
    expect(genreLabel('   ')).toBe('(no genre)');
  });

  it('trims stored genre text', () => {
    expect(genreLabel('  Jazz  ')).toBe('Jazz');
  });
});
