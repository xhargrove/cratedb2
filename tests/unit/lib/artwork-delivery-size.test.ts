import { describe, expect, it } from 'vitest';

import { parseArtworkDeliverySize } from '@/lib/artwork-delivery-size';

describe('parseArtworkDeliverySize', () => {
  it('accepts known sizes', () => {
    expect(parseArtworkDeliverySize('thumb')).toBe('thumb');
    expect(parseArtworkDeliverySize('medium')).toBe('medium');
    expect(parseArtworkDeliverySize('full')).toBe('full');
  });

  it('defaults invalid or missing values to full for backward compatibility', () => {
    expect(parseArtworkDeliverySize(null)).toBe('full');
    expect(parseArtworkDeliverySize(undefined)).toBe('full');
    expect(parseArtworkDeliverySize('')).toBe('full');
    expect(parseArtworkDeliverySize('huge')).toBe('full');
    expect(parseArtworkDeliverySize('THUMB')).toBe('full');
  });
});
