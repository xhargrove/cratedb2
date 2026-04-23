import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/auth/session-cookie', () => ({
  getSessionCookieValue: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

vi.mock('@/server/auth/session-service', () => ({
  resolveSessionForToken: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('resolveAuth', () => {
  beforeEach(async () => {
    vi.resetModules();
    const cookieMod = await import('@/server/auth/session-cookie');
    vi.mocked(cookieMod.getSessionCookieValue).mockReset();
    vi.mocked(cookieMod.clearSessionCookie).mockReset();
    const sessMod = await import('@/server/auth/session-service');
    vi.mocked(sessMod.resolveSessionForToken).mockReset();
  });

  it('does not clear cookie when session lookup is transient', async () => {
    const { getSessionCookieValue, clearSessionCookie } =
      await import('@/server/auth/session-cookie');
    const { resolveSessionForToken } =
      await import('@/server/auth/session-service');

    vi.mocked(getSessionCookieValue).mockResolvedValue('opaque-token');
    vi.mocked(resolveSessionForToken).mockResolvedValue({
      outcome: 'transient_backend_error',
    });

    const { resolveAuth } = await import('@/server/auth/get-current-user');
    const r = await resolveAuth();

    expect(r).toEqual({ status: 'backend_unavailable' });
    expect(clearSessionCookie).not.toHaveBeenCalled();
  });

  it('clears cookie when session row is missing', async () => {
    const { getSessionCookieValue, clearSessionCookie } =
      await import('@/server/auth/session-cookie');
    const { resolveSessionForToken } =
      await import('@/server/auth/session-service');

    vi.mocked(getSessionCookieValue).mockResolvedValue('opaque-token');
    vi.mocked(resolveSessionForToken).mockResolvedValue({
      outcome: 'not_found',
    });

    const { resolveAuth } = await import('@/server/auth/get-current-user');
    const r = await resolveAuth();

    expect(r).toMatchObject({
      status: 'unauthenticated',
      reason: 'invalid_session',
    });
    expect(clearSessionCookie).toHaveBeenCalledTimes(1);
  });

  it('returns unauthenticated without touching session when no cookie', async () => {
    const { getSessionCookieValue, clearSessionCookie } =
      await import('@/server/auth/session-cookie');
    const { resolveSessionForToken } =
      await import('@/server/auth/session-service');

    vi.mocked(getSessionCookieValue).mockResolvedValue(undefined);
    vi.mocked(resolveSessionForToken).mockResolvedValue({
      outcome: 'session',
      user: {} as never,
    });

    const { resolveAuth } = await import('@/server/auth/get-current-user');
    const r = await resolveAuth();

    expect(r).toEqual({ status: 'unauthenticated', reason: 'no_cookie' });
    expect(resolveSessionForToken).not.toHaveBeenCalled();
    expect(clearSessionCookie).not.toHaveBeenCalled();
  });
});
