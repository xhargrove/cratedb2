import { describe, expect, it } from 'vitest';

import {
  MAX_ARTWORK_BYTES,
  detectArtworkMimeFromBytes,
  extensionForMime,
  parseArtworkFileUpload,
} from '@/lib/validations/artwork';

describe('detectArtworkMimeFromBytes', () => {
  it('detects JPEG', () => {
    const buf = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
    ]);
    expect(detectArtworkMimeFromBytes(buf)).toBe('image/jpeg');
  });

  it('detects PNG', () => {
    const buf = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
    ]);
    expect(detectArtworkMimeFromBytes(buf)).toBe('image/png');
  });

  it('returns null for random bytes', () => {
    expect(detectArtworkMimeFromBytes(new Uint8Array([1, 2, 3, 4]))).toBe(null);
  });
});

describe('extensionForMime', () => {
  it('maps allowed types', () => {
    expect(extensionForMime('image/jpeg')).toBe('jpg');
    expect(extensionForMime('image/png')).toBe('png');
    expect(extensionForMime('image/webp')).toBe('webp');
    expect(extensionForMime('image/gif')).toBe('gif');
  });
});

describe('parseArtworkFileUpload', () => {
  it('returns absent for missing file', async () => {
    const out = await parseArtworkFileUpload(undefined);
    expect(out).toEqual({ ok: true, kind: 'absent' });
  });

  it('treats zero-byte file as absent (unchosen file input)', async () => {
    const file = new File([], 'x.jpg', { type: 'image/jpeg' });
    const out = await parseArtworkFileUpload(file);
    expect(out).toEqual({ ok: true, kind: 'absent' });
  });

  it('rejects oversized payload', async () => {
    const tinyLimit = 10;
    const jpeg = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
    ]);
    const copy = new Uint8Array(jpeg.length + tinyLimit + 5);
    copy.set(jpeg, 0);
    copy.fill(0xaa, jpeg.length);

    const file = new File([copy], 'big.jpg');
    const out = await parseArtworkFileUpload(file, tinyLimit);
    expect(out.ok).toBe(false);
  });

  it('accepts small valid JPEG bytes', async () => {
    const jpeg = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
    ]);
    const file = new File([jpeg], 'photo.jpg');
    const out = await parseArtworkFileUpload(file, MAX_ARTWORK_BYTES);
    expect(out).toMatchObject({
      ok: true,
      kind: 'present',
      mimeType: 'image/jpeg',
    });
  });
});
