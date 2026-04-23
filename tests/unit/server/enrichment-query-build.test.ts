import { describe, expect, it } from 'vitest';

import { buildMusicBrainzReleaseQuery } from '@/server/enrichment/query-build';

describe('buildMusicBrainzReleaseQuery', () => {
  it('builds artist and release phrases', () => {
    const q = buildMusicBrainzReleaseQuery('David Bowie', 'Low');
    expect(q).toContain('artist:"David Bowie"');
    expect(q).toContain('release:"Low"');
  });

  it('escapes double quotes in phrases', () => {
    const q = buildMusicBrainzReleaseQuery('Say "Hi"', 'Album');
    expect(q).toContain('\\"');
  });
});
