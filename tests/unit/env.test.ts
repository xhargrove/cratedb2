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

  it('requires s3 credentials when artwork backend is s3', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://u:p@localhost:5432/db');
    vi.stubEnv('ARTWORK_STORAGE_BACKEND', 's3');
    vi.stubEnv('S3_BUCKET', '');
    vi.stubEnv('S3_REGION', '');
    vi.stubEnv('S3_ACCESS_KEY_ID', '');
    vi.stubEnv('S3_SECRET_ACCESS_KEY', '');

    const { getServerEnv } = await import('@/lib/env');
    expect(() => getServerEnv()).toThrow(
      /missing required S3 vars for ARTWORK_STORAGE_BACKEND=s3/
    );
  });
});
