import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  extensionForMime,
  type AllowedArtworkMimeType,
} from '@/lib/validations/artwork';

/**
 * Local filesystem artwork store. Single strategy for Phase 5; paths are
 * relative keys (`{ownerId}/{recordId}.{ext}`) so an object-storage backend can
 * swap in later without changing callers.
 */

export function getArtworkStorageRoot(): string {
  const raw = process.env.ARTWORK_STORAGE_ROOT;
  if (raw && raw.trim()) {
    return path.resolve(raw.trim());
  }
  return path.join(process.cwd(), 'storage', 'artwork');
}

/** Relative key persisted in DB — never absolute paths. */
export function artworkRelativeKey(
  ownerId: string,
  recordId: string,
  mimeType: AllowedArtworkMimeType
): string {
  const ext = extensionForMime(mimeType);
  return `${ownerId}/${recordId}.${ext}`;
}

export function resolveArtworkAbsolutePath(relativeKey: string): string {
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
