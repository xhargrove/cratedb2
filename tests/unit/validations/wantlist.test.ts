import { describe, expect, it } from 'vitest';

import { parseWantlistForm } from '@/lib/validations/wantlist';

describe('parseWantlistForm', () => {
  it('requires artist and title', () => {
    const fd = new FormData();
    fd.set('artist', '');
    fd.set('title', 'Album');
    const out = parseWantlistForm(fd);
    expect(out.ok).toBe(false);
  });

  it('parses optional year', () => {
    const fd = new FormData();
    fd.set('artist', 'X');
    fd.set('title', 'Y');
    fd.set('year', '1999');
    const out = parseWantlistForm(fd);
    expect(out).toMatchObject({
      ok: true,
      data: { artist: 'X', title: 'Y', year: 1999 },
    });
  });
});
