import { describe, expect, it } from 'vitest';

import {
  parseRecordForm,
  parseRecordId,
  recordWriteFormSchema,
} from '@/lib/validations/record';

describe('parseRecordForm', () => {
  it('parses required artist and title', () => {
    const fd = new FormData();
    fd.set('artist', 'Miles Davis');
    fd.set('title', 'Kind of Blue');
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
    const r = parseRecordForm(fd);
    expect(r.ok).toBe(false);
  });

  it('parses optional year', () => {
    const fd = new FormData();
    fd.set('artist', 'A');
    fd.set('title', 'B');
    fd.set('year', '1959');
    const r = parseRecordForm(fd);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.year).toBe(1959);
  });

  it('parses absent optional fields as undefined', () => {
    const fd = new FormData();
    fd.set('artist', 'A');
    fd.set('title', 'B');
    const r = parseRecordForm(fd);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.genre).toBeUndefined();
      expect(r.data.storageLocation).toBeUndefined();
    }
  });
});

describe('recordWriteFormSchema', () => {
  it('rejects invalid year range', () => {
    const r = recordWriteFormSchema.safeParse({
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
