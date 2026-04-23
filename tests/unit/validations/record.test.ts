import { describe, expect, it } from 'vitest';

import {
  parseRecordForm,
  parseRecordId,
  recordBaseFieldsSchema,
} from '@/lib/validations/record';

describe('parseRecordForm', () => {
  it('parses required artist and title', () => {
    const fd = new FormData();
    fd.set('artist', 'Miles Davis');
    fd.set('title', 'Kind of Blue');
    addStorageNone(fd);
    const r = parseRecordForm(fd);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.artist).toBe('Miles Davis');
      expect(r.data.title).toBe('Kind of Blue');
    }
  });

  it('rejects empty artist', () => {
    const fd = new FormData();
    fd.set('artist', '  ');
    fd.set('title', 'X');
    addStorageNone(fd);
    const r = parseRecordForm(fd);
    expect(r.ok).toBe(false);
  });

  it('parses optional year', () => {
    const fd = new FormData();
    fd.set('artist', 'A');
    fd.set('title', 'B');
    fd.set('year', '1959');
    addStorageNone(fd);
    const r = parseRecordForm(fd);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.year).toBe(1959);
  });

  it('parses absent optional fields', () => {
    const fd = new FormData();
    fd.set('artist', 'A');
    fd.set('title', 'B');
    addStorageNone(fd);
    const r = parseRecordForm(fd);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.genre).toBeUndefined();
      expect(r.data.storageKind).toBe('NONE');
      expect(r.data.storageLocation).toBeNull();
      expect(r.data.quantity).toBe(1);
    }
  });

  it('parses copies / quantity', () => {
    const fd = new FormData();
    fd.set('artist', 'A');
    fd.set('title', 'B');
    fd.set('quantity', '3');
    addStorageNone(fd);
    const r = parseRecordForm(fd);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.quantity).toBe(3);
  });

  it('parses structured shelf storage', () => {
    const fd = new FormData();
    fd.set('artist', 'A');
    fd.set('title', 'B');
    fd.set('storageKind', 'SHELF');
    fd.set('shelfRow', '2');
    fd.set('shelfColumn', '3');
    fd.set('crateNumber', '');
    fd.set('boxPreset', '');
    fd.set('boxCustomLabel', '');
    const r = parseRecordForm(fd);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.storageKind).toBe('SHELF');
      expect(r.data.shelfRow).toBe(2);
      expect(r.data.shelfColumn).toBe(3);
      expect(r.data.storageLocation).toBe('Shelf · Row 2 · Column 3');
    }
  });
});

function addStorageNone(fd: FormData) {
  fd.set('storageKind', 'NONE');
  fd.set('shelfRow', '');
  fd.set('shelfColumn', '');
  fd.set('crateNumber', '');
  fd.set('boxPreset', '');
  fd.set('boxCustomLabel', '');
}

describe('recordBaseFieldsSchema', () => {
  it('rejects invalid year range', () => {
    const r = recordBaseFieldsSchema.safeParse({
      artist: 'a',
      title: 'b',
      year: 1850,
    });
    expect(r.success).toBe(false);
  });
});

describe('parseRecordId', () => {
  it('accepts non-empty id string', () => {
    const r = parseRecordId('clxxxxxxxxxxxxxxxxxxxxxxxx');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.id).toBe('clxxxxxxxxxxxxxxxxxxxxxxxx');
  });

  it('rejects empty id', () => {
    const r = parseRecordId('');
    expect(r.ok).toBe(false);
  });
});
