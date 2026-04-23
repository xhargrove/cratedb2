import type { AllowedArtworkMimeType } from '@/lib/validations/artwork';
import { getServerEnv } from '@/lib/env';
import { createLocalArtworkStore } from '@/server/storage/local-artwork-store';
import { createS3ArtworkStore } from '@/server/storage/object-artwork-store';
import type { ArtworkStore } from '@/server/storage/types';

const globalForArtworkStore = globalThis as unknown as {
  artworkStore: ArtworkStore | undefined;
};

function createArtworkStore(): ArtworkStore {
  const env = getServerEnv();
  const backend = env.ARTWORK_STORAGE_BACKEND;

  if (backend === 'local') {
    return createLocalArtworkStore();
  }

  if (
    !env.S3_BUCKET ||
    !env.S3_REGION ||
    !env.S3_ACCESS_KEY_ID ||
    !env.S3_SECRET_ACCESS_KEY
  ) {
    throw new Error(
      'Invalid server environment: missing required S3 vars for ARTWORK_STORAGE_BACKEND=s3'
    );
  }

  return createS3ArtworkStore({
    bucket: env.S3_BUCKET,
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT || undefined,
    forcePathStyle: env.S3_FORCE_PATH_STYLE === 'true',
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  });
}

/**
 * One store per Node process on all environments. Caching only in dev used to
 * spawn a new S3 client (or local store) on **every** image request in
 * production — parallel grid loads could exhaust sockets and return 500s.
 */
export function getArtworkStore(): ArtworkStore {
  if (globalForArtworkStore.artworkStore) {
    return globalForArtworkStore.artworkStore;
  }

  const store = createArtworkStore();
  globalForArtworkStore.artworkStore = store;
  return store;
}

export async function writeArtworkObject(
  key: string,
  buffer: Buffer,
  mimeType: AllowedArtworkMimeType
) {
  return getArtworkStore().putObject(key, buffer, mimeType);
}

export async function readArtworkObject(key: string) {
  return getArtworkStore().getObject(key);
}

export async function deleteArtworkObject(key: string) {
  return getArtworkStore().deleteObject(key);
}

export async function artworkObjectExists(key: string) {
  return getArtworkStore().objectExists(key);
}
