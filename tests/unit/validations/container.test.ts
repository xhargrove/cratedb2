import { describe, expect, it } from 'vitest';

import {
  parseContainerForm,
  parseContainerId,
  parseRecordContainerIdField,
} from '@/lib/validations/container';

describe('parseContainerForm', () => {
  it('parses name and kind', () => {
    const fd = new FormData();
    fd.set('name', '  Shelf A  ');
    fd.set('kind', 'SHELF');
    fd.set('locationNote', '');
    const r = parseContainerForm(fd);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.name).toBe('Shelf A');
      expect(r.data.kind).toBe('SHELF');
    }
  });

  it('defaults invalid kind to SHELF', () => {
    const fd = new FormData();
    fd.set('name', 'X');
    fd.set('kind', 'nope');
    fd.set('locationNote', '');
    const r = parseContainerForm(fd);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.kind).toBe('SHELF');
  });
});

describe('parseContainerId', () => {
  it('accepts non-empty id', () => {
    const r = parseContainerId('abc123');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.id).toBe('abc123');
  });

  it('rejects empty', () => {
    expect(parseContainerId('').ok).toBe(false);
  });
});

describe('parseRecordContainerIdField', () => {
  it('returns null for empty', () => {
    const fd = new FormData();
    fd.set('containerId', '');
    const r = parseRecordContainerIdField(fd);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.containerId).toBeNull();
  });
});
