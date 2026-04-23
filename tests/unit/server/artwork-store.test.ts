import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getServerEnv: vi.fn(),
  createLocalArtworkStore: vi.fn(),
  createS3ArtworkStore: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  getServerEnv: mocks.getServerEnv,
}));

vi.mock('@/server/storage/local-artwork-store', () => ({
  createLocalArtworkStore: mocks.createLocalArtworkStore,
}));

vi.mock('@/server/storage/object-artwork-store', () => ({
  createS3ArtworkStore: mocks.createS3ArtworkStore,
}));

describe('getArtworkStore', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.getServerEnv.mockReset();
    mocks.createLocalArtworkStore.mockReset();
    mocks.createS3ArtworkStore.mockReset();
    (globalThis as { artworkStore?: unknown }).artworkStore = undefined;
  });

  it('uses local store when backend=local', async () => {
    const localStore = {
      putObject: vi.fn(),
      getObject: vi.fn(),
      deleteObject: vi.fn(),
      objectExists: vi.fn(),
    };
    mocks.getServerEnv.mockReturnValue({
      ARTWORK_STORAGE_BACKEND: 'local',
    });
    mocks.createLocalArtworkStore.mockReturnValue(localStore);

    const mod = await import('@/server/storage/artwork-store');
    const store = mod.getArtworkStore();
    expect(store).toBe(localStore);
    expect(mocks.createLocalArtworkStore).toHaveBeenCalledTimes(1);
    expect(mocks.createS3ArtworkStore).not.toHaveBeenCalled();
  });

  it('uses s3 store when backend=s3', async () => {
    const s3Store = {
      putObject: vi.fn(),
      getObject: vi.fn(),
      deleteObject: vi.fn(),
      objectExists: vi.fn(),
    };
    mocks.getServerEnv.mockReturnValue({
      ARTWORK_STORAGE_BACKEND: 's3',
      S3_BUCKET: 'bucket',
      S3_REGION: 'us-east-1',
      S3_ENDPOINT: '',
      S3_FORCE_PATH_STYLE: 'false',
      S3_ACCESS_KEY_ID: 'id',
      S3_SECRET_ACCESS_KEY: 'secret',
    });
    mocks.createS3ArtworkStore.mockReturnValue(s3Store);

    const mod = await import('@/server/storage/artwork-store');
    const store = mod.getArtworkStore();
    expect(store).toBe(s3Store);
    expect(mocks.createS3ArtworkStore).toHaveBeenCalledWith({
      bucket: 'bucket',
      region: 'us-east-1',
      endpoint: undefined,
      forcePathStyle: false,
      accessKeyId: 'id',
      secretAccessKey: 'secret',
    });
  });
});
