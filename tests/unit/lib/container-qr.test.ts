import { describe, expect, it } from 'vitest';

import { qrCodePngDataUrl } from '@/lib/container-qr';

describe('qrCodePngDataUrl', () => {
  it('returns a PNG data URL for a stable link', async () => {
    const url = 'https://example.com/dashboard/containers/abc';
    const dataUrl = await qrCodePngDataUrl(url);
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
    expect(dataUrl.length).toBeGreaterThan(200);
  });
});
