import { describe, expect, it } from 'vitest';

import { initialsFromDisplayLabel } from '@/lib/profile-initials';

describe('initialsFromDisplayLabel', () => {
  it('uses first two words when present', () => {
    expect(initialsFromDisplayLabel('Nina Simone')).toBe('NS');
  });

  it('uses first two letters of a single word when long enough', () => {
    expect(initialsFromDisplayLabel('waxhunter')).toBe('WA');
  });

  it('handles Collector fallback label', () => {
    expect(initialsFromDisplayLabel('Collector abcdef12')).toBe('CA');
  });
});
