import { describe, expect, it } from 'vitest';

import {
  buildWantlistDedupeKey,
  normalizeWantlistToken,
} from '@/lib/wantlist-dedupe';

describe('wantlist dedupe', () => {
  it('normalizes case and whitespace', () => {
    expect(normalizeWantlistToken('  The   Doors  ')).toBe('the doors');
  });

  it('builds stable keys for same logical identity', () => {
    const a = buildWantlistDedupeKey('The Doors', 'L.A. Woman', 1971);
    const b = buildWantlistDedupeKey('  the doors  ', 'L.A. Woman', 1971);
    expect(a).toBe(b);
  });

  it('treats missing year consistently', () => {
    expect(buildWantlistDedupeKey('a', 'b', undefined)).toEqual(
      buildWantlistDedupeKey('a', 'b', null)
    );
  });

  it('differs when year differs', () => {
    expect(buildWantlistDedupeKey('a', 'b', 1971)).not.toEqual(
      buildWantlistDedupeKey('a', 'b', 1972)
    );
  });
});
