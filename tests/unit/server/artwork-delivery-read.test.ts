import { beforeEach, describe, expect, it, vi } from 'vitest';

const readArtworkObject = vi.fn();

vi.mock('@/server/storage/artwork-store', () => ({
  readArtworkObject,
}));

describe('readArtworkForDelivery', () => {
  beforeEach(() => {
    readArtworkObject.mockReset();
  });

  it('serves full size from the base key with stored MIME', async () => {
    readArtworkObject.mockResolvedValueOnce({
      buffer: Buffer.from([1, 2, 3]),
    });
    const { readArtworkForDelivery } =
      await import('@/server/storage/artwork-delivery-read');
    const out = await readArtworkForDelivery('o/rec.jpg', 'image/jpeg', 'full');
    expect(readArtworkObject).toHaveBeenCalledWith('o/rec.jpg');
    expect(out?.contentType).toBe('image/jpeg');
    expect([...out!.bytes]).toEqual([1, 2, 3]);
  });

  it('serves thumb as WebP when the derivative object exists', async () => {
    readArtworkObject.mockResolvedValueOnce({
      buffer: Buffer.from([9, 9]),
    });
    const { readArtworkForDelivery } =
      await import('@/server/storage/artwork-delivery-read');
    const out = await readArtworkForDelivery(
      'owner/album.png',
      'image/png',
      'thumb'
    );
    expect(readArtworkObject).toHaveBeenCalledWith('owner/album.thumb.webp');
    expect(out?.contentType).toBe('image/webp');
  });

  it('falls back to the original when the thumb variant is missing', async () => {
    readArtworkObject
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ buffer: Buffer.from([7]) });
    const { readArtworkForDelivery } =
      await import('@/server/storage/artwork-delivery-read');
    const out = await readArtworkForDelivery('o/x.webp', 'image/webp', 'thumb');
    expect(readArtworkObject).toHaveBeenNthCalledWith(1, 'o/x.thumb.webp');
    expect(readArtworkObject).toHaveBeenNthCalledWith(2, 'o/x.webp');
    expect(out?.contentType).toBe('image/webp');
    expect([...out!.bytes]).toEqual([7]);
  });
});
