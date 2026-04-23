import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { AllowedArtworkMimeType } from '@/lib/validations/artwork';
import { assertValidArtworkKey } from '@/server/storage/artwork-keys';
import type { ArtworkStore } from '@/server/storage/types';

/**
 * Local filesystem artwork store. Paths in the DB are relative keys so a
 * different backend can swap in later.
 *
 * **Deployment:** Default root is `path.join(process.cwd(), 'storage', 'artwork')`.
 * In production, `process.cwd()` is the app working directory (not a dev path).
 * Use `ARTWORK_STORAGE_ROOT` for an absolute path, typically on a **persistent**
 * mount — ephemeral serverless disks drop data on redeploy.
 */

export function getArtworkStorageRoot(): string {
  const raw = process.env.ARTWORK_STORAGE_ROOT;
  if (raw && raw.trim()) {
    return path.resolve(raw.trim());
  }
  return path.join(process.cwd(), 'storage', 'artwork');
}

export function resolveArtworkAbsolutePath(relativeKey: string): string {
  assertValidArtworkKey(relativeKey);
  const root = path.resolve(getArtworkStorageRoot());
  const resolved = path.resolve(root, relativeKey);
  const rel = path.relative(root, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Invalid artwork path');
  }
  return resolved;
}

export async function ensureParentDir(absoluteFilePath: string): Promise<void> {
  await fs.mkdir(path.dirname(absoluteFilePath), { recursive: true });
}

export async function writeArtworkFile(
  relativeKey: string,
  buffer: Buffer
): Promise<void> {
  const abs = resolveArtworkAbsolutePath(relativeKey);
  await ensureParentDir(abs);
  await fs.writeFile(abs, buffer, { mode: 0o644 });
}

export async function deleteArtworkFile(relativeKey: string): Promise<void> {
  try {
    const abs = resolveArtworkAbsolutePath(relativeKey);
    await fs.unlink(abs);
  } catch (e: unknown) {
    const code = (e as NodeJS.ErrnoException)?.code;
    if (code !== 'ENOENT') throw e;
  }
}

export async function artworkFileExists(relativeKey: string): Promise<boolean> {
  try {
    const abs = resolveArtworkAbsolutePath(relativeKey);
    await fs.access(abs);
    return true;
  } catch {
    return false;
  }
}

export async function readArtworkFile(relativeKey: string): Promise<Buffer> {
  const abs = resolveArtworkAbsolutePath(relativeKey);
  return fs.readFile(abs);
}

export function createLocalArtworkStore(): ArtworkStore {
  return {
    async putObject(
      key: string,
      buffer: Buffer,
      mimeType: AllowedArtworkMimeType
    ) {
      void mimeType;
      await writeArtworkFile(key, buffer);
    },
    async getObject(key: string) {
      try {
        return { buffer: await readArtworkFile(key), mimeType: null };
      } catch {
        return null;
      }
    },
    async deleteObject(key: string) {
      await deleteArtworkFile(key);
    },
    async objectExists(key: string) {
      return artworkFileExists(key);
    },
  };
}
