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

  it('parses when s3 backend is set but credentials missing (validated at artwork store)', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://u:p@localhost:5432/db');
    vi.stubEnv('ARTWORK_STORAGE_BACKEND', 's3');
    vi.stubEnv('S3_BUCKET', '');
    vi.stubEnv('S3_REGION', '');
    vi.stubEnv('S3_ACCESS_KEY_ID', '');
    vi.stubEnv('S3_SECRET_ACCESS_KEY', '');

    const { getServerEnv } = await import('@/lib/env');
    expect(getServerEnv().ARTWORK_STORAGE_BACKEND).toBe('s3');
  });
});
