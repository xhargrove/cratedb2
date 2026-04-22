import { afterEach, describe, expect, it, vi } from 'vitest';

describe('getServerEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('parses valid server env', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://u:p@localhost:5432/db');
    vi.stubEnv('NODE_ENV', 'test');

    const { getServerEnv } = await import('@/lib/env');
    const env = getServerEnv();
    expect(env.DATABASE_URL).toContain('postgresql://');
  });
});
