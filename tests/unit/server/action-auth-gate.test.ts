import { beforeEach, describe, expect, it, vi } from 'vitest';

const { resolveAuth } = vi.hoisted(() => ({
  resolveAuth: vi.fn(),
}));

vi.mock('@/server/auth/get-current-user', () => ({
  resolveAuth,
}));

import { requireUserForServerAction } from '@/server/auth/action-auth-gate';

describe('requireUserForServerAction', () => {
  beforeEach(() => {
    resolveAuth.mockReset();
  });

  it('returns error when backend unavailable', async () => {
    resolveAuth.mockResolvedValue({ status: 'backend_unavailable' });
    const r = await requireUserForServerAction();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('session');
  });

  it('returns user when authenticated', async () => {
    resolveAuth.mockResolvedValue({
      status: 'authenticated',
      user: { id: 'u1' },
    });
    const r = await requireUserForServerAction();
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.user.id).toBe('u1');
  });
});
