import { describe, expect, it } from 'vitest';

import { parseFollowTargetUserId } from '@/lib/validations/follow';

describe('parseFollowTargetUserId', () => {
  it('parses trimmed id', () => {
    const out = parseFollowTargetUserId('  abc123  ');
    expect(out).toEqual({ ok: true, targetUserId: 'abc123' });
  });

  it('rejects empty', () => {
    const out = parseFollowTargetUserId('');
    expect(out.ok).toBe(false);
  });
});
