import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  profileImageRelativeKey,
  resolveArtworkAbsolutePath,
  singleArtworkRelativeKey,
  writeArtworkFile,
  readArtworkFile,
  deleteArtworkFile,
} from '@/server/storage/local-artwork-store';

describe('local-artwork-store', () => {
  let dir: string;
  let prevEnv: string | undefined;

  beforeEach(async () => {
    prevEnv = process.env.ARTWORK_STORAGE_ROOT;
    dir = await mkdtemp(path.join(tmpdir(), 'crate-art-'));
    process.env.ARTWORK_STORAGE_ROOT = dir;
  });

  afterEach(async () => {
    process.env.ARTWORK_STORAGE_ROOT = prevEnv;
    await rm(dir, { recursive: true, force: true });
  });

  it('rejects path traversal in relative keys', () => {
    expect(() => resolveArtworkAbsolutePath('../outside/evil.jpg')).toThrow(
      /Invalid artwork path/
    );
  });

  it('builds singles keys under singles/ subdirectory', () => {
    expect(singleArtworkRelativeKey('u1', 's1', 'image/jpeg')).toBe(
      'u1/singles/s1.jpg'
    );
  });

  it('builds profile image key with stable filename', () => {
    expect(profileImageRelativeKey('user1', 'image/png')).toBe('user1/profile.png');
  });

  it('writes and reads binary bytes', async () => {
    const key = 'owner1/rec1.jpg';
    const payload = Buffer.from([0xff, 0xd8, 0xff]);
    await writeArtworkFile(key, payload);
    const round = await readArtworkFile(key);
    expect(round.equals(payload)).toBe(true);
    await deleteArtworkFile(key);
    await expect(readArtworkFile(key)).rejects.toThrow();
  });
});
