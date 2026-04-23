import { describe, expect, it } from 'vitest';

import { parseSingleForm } from '@/lib/validations/single';

describe('parseSingleForm', () => {
  it('parses required artist and A-side title', () => {
    const fd = new FormData();
    fd.set('artist', 'The Beatles');
    fd.set('title', 'Hey Jude');
    const out = parseSingleForm(fd);
    expect(out).toEqual({
      ok: true,
      data: expect.objectContaining({
        artist: 'The Beatles',
        title: 'Hey Jude',
      }),
    });
  });

  it('accepts optional B-side', () => {
    const fd = new FormData();
    fd.set('artist', 'X');
    fd.set('title', 'A-side hit');
    fd.set('bSideTitle', 'Flip song');
    const out = parseSingleForm(fd);
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.data.bSideTitle).toBe('Flip song');
  });
});
