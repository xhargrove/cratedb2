import { describe, expect, it } from 'vitest';

import {
  decodePhysicalSlotKey,
  encodePhysicalSlotKey,
  physicalSlotFromRecordFields,
  physicalSlotLabel,
} from '@/lib/physical-storage-slot';

describe('physical storage slot key', () => {
  it('round-trips SHELF', () => {
    const slot = {
      storageKind: 'SHELF' as const,
      shelfRow: 2,
      shelfColumn: 3,
      crateNumber: null,
      boxNumber: null,
      boxCustomLabel: null,
    };
    const key = encodePhysicalSlotKey(slot);
    expect(decodePhysicalSlotKey(key)).toEqual(slot);
  });

  it('round-trips CRATE', () => {
    const slot = {
      storageKind: 'CRATE' as const,
      shelfRow: null,
      shelfColumn: null,
      crateNumber: 5,
      boxNumber: null,
      boxCustomLabel: null,
    };
    const key = encodePhysicalSlotKey(slot);
    expect(decodePhysicalSlotKey(key)).toEqual(slot);
  });

  it('round-trips BOX by number', () => {
    const slot = {
      storageKind: 'BOX' as const,
      shelfRow: null,
      shelfColumn: null,
      crateNumber: null,
      boxNumber: 1,
      boxCustomLabel: null,
    };
    const key = encodePhysicalSlotKey(slot);
    expect(decodePhysicalSlotKey(key)).toEqual(slot);
  });

  it('round-trips BOX by custom label', () => {
    const slot = {
      storageKind: 'BOX' as const,
      shelfRow: null,
      shelfColumn: null,
      crateNumber: null,
      boxNumber: null,
      boxCustomLabel: 'Jazz singles',
    };
    const key = encodePhysicalSlotKey(slot);
    expect(decodePhysicalSlotKey(key)).toEqual(slot);
  });

  it('rejects invalid segment', () => {
    expect(decodePhysicalSlotKey('')).toBeNull();
    expect(decodePhysicalSlotKey('not-base64')).toBeNull();
    expect(decodePhysicalSlotKey('aaaa')).toBeNull();
  });

  it('rejects BOX wire with both bn and bcl', () => {
    const bad = Buffer.from(
      JSON.stringify({ v: 1, k: 'BOX', bn: 1, bcl: 'x' }),
      'utf8'
    ).toString('base64url');
    expect(decodePhysicalSlotKey(bad)).toBeNull();
  });
});

describe('physicalSlotLabel', () => {
  it('matches composeStorageLocation for shelf', () => {
    const slot = physicalSlotFromRecordFields({
      storageKind: 'SHELF',
      shelfRow: 1,
      shelfColumn: 1,
      crateNumber: null,
      boxNumber: null,
      boxCustomLabel: null,
    });
    expect(slot).not.toBeNull();
    expect(physicalSlotLabel(slot!)).toBe('Shelf · Row 1 · Column 1');
  });
});
